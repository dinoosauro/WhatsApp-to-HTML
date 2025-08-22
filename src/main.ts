declare global {
  interface Window {
    showDirectoryPicker?: ({ id, mode }: { id: string, mode: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle>
  }
}
import type JSZip from "jszip";
import icons from "./icons";

(() => {
  interface UsedFileProps extends Blob {
    name: string
  }


  interface MsgStorage {
    text: string,
    author: string,
    date: string,
    isMainUser: boolean,
  }
  interface Language {
    it: string,
    es: string,
    de: string,
    fr: string
  }


  const imageExtensions = ["jpg", "png", "webp", "jpeg", "avif", "gif"];
  const videoExtensions = ["mp4", "webm", "mov", "mkv"];
  const audioExtensions = ["mp3", "aac", "m4a", "opus", "ogg", "wav", "flac", "alac"];
  /**
   * A map with the translation on some strings used on the exported txt file by WhatsApp.
   * These are used to identify and fetch poll/event information
   */
  const WhatsAppStringTranslations = new Map<string, Language>([
    ["WhatsApp Notification", { it: "Notifiche di WhatsApp", es: "Notificación de WhatsApp", de: "WhatsApp-Benachrichtigung", fr: "Notification WhatsApp" }],
    [" POLL:\n", { it: " SONDAGGIO:\n", es: " ENCUESTA:\n", de: " UMFRAGE:\n", fr: " SONDAGE  :\n" }],
    ["\nOPTION: ", { it: "\nOPZIONE: ", es: "\nOPCIÓN: ", de: "\nOPTION: ", fr: "\nOPTION  : " }],
    [" vote", { it: " vot", es: " vot", de: " Stimme", fr: "vote" }],
    [" EVENT: ", { it: " EVENTO: ", es: " EVENTO: ", de: " EREIGNIS: ", fr: " ÉVÉNEMENT : " }],
    ["Event Start time", { it: "Ora di inizio dell'evento", es: "Hora de inicio del evento", de: "Startzeit des Ereignisses", fr: "Heure de début de l’événement : " }],
    ["\nEvent Start time: ", { it: "\nOra di inizio dell'evento: ", es: "\nHora de inicio del evento: ", de: "\nStartzeit des Ereignisses: ", fr: "\nHeure de début de l’événement : " }],
    ["Event Cancelled:", { it: "Evento annullato:", es: "Evento cancelado:", de: "Ereignis abgesagt:", fr: "Événement annulé :" }],
    ["Event Description: ", { it: "Descrizione dell'evento: ", es: "Descripción del evento: ", de: "Beschreibung des Ereignisses: ", fr: "Description de l’événement : " }],
    ["Event Join Link: ", { it: "Link di partecipazione all'evento: ", es: "Enlace para unirse al evento ", de: "Beitrittslink des Ereignisses: ", fr: "Lien de participation à l’événement : " }],
    ["Event Location Name: ", { it: "Nome del luogo dell'evento: ", es: "Nombre de la ubicación del evento: ", de: "Standortname des Ereignisses: ", fr: "Nom du lieu de l’événement : " }],
    ["Event Location Point: ", { it: "Localizzazione dell'evento: ", es: "Ubicación del evento: ", de: "Genauer Standort des Ereignisses: ", fr: "Point de localisation de l’événement : " }],
    ["Autodetected poll", { it: "Sondaggio rilevato automaticamente", es: "Encuesta detectada automáticamente", de: "Automatisch erkannte umfrage", fr: "Sondage détecté automatiquement" }],
    ["Autodetected event", { it: "Evento rilevato automaticamente", es: "Evento detectado automáticamente", de: "Automatisch erkanntes ereignis", fr: "Événement détecté automatiquement" }]
  ]);
  let jsZip: JSZip;
  let fileHandle: FileSystemDirectoryHandle | undefined;

  /**
   * Translate a string by looking it into the WhatsappStringTranslations Map
   * @param str the string to translate
   * @returns the translated string
   */
  function getTranslatedItem(str: string) {
    const translation = WhatsAppStringTranslations.get(str);
    if (!translation) return str;
    return translation[(document.getElementById("language") as HTMLInputElement).value as "it"] ?? str;
  }

  /**
   * Generate the HTML file
   * @param elements the passed files. It must be a Blob, with the name property.
   */
  async function main(elements: UsedFileProps[]) {
    const arrStorage: MsgStorage[] = [];
    if ((document.getElementById("zipFile") as HTMLSelectElement).value === "zip") jsZip = new (await import("jszip")).default;
    for (const file of elements.filter(({ name }) => name.endsWith("txt"))) {
      const text = await file.text();
      const isMacVersion = (text.indexOf("[") === -1 ? Infinity : text.indexOf("[")) < text.indexOf(":");
      /**
       * So:
       * - The US formats string as "M(M)/DD/YY": this means that from January to September only a number is shown as the month (in the first position).
       * - However, this is done also by Spain, that follows the global DD/MM/YY syntax. So, also the second number can be of 1 or 2 digit.
       * - Spain puts the hour number in 1-digit if possible. 
       * - Germany uses "." instead of "/" for the date. 
       * - France uses full year (YYYY).
       * - The macOS versions export also the seconds of the message, so an optional (:\d\d) must be put at the end
       */
      arrStorage.push(...Array.from(text.matchAll(/\b\d{1,2}\b[\/.]\d{1,2}[\/.]\d{2,4}, \d{1,2}:\d\d(:\d\d)?/gi)).map((item, i, arr) => {
        /**
         * The item that needs to be analyzed.
         * What we do here is quite simple: we do a substring of the item by checking the start of the next Regex (obviously if that array entry exists)
         */
        const updatedItem = item.input.substring(item.index, arr[i + 1] ? arr[i + 1].index : undefined);
        let author = updatedItem.substring(isMacVersion ? updatedItem.indexOf("]") + 2 : updatedItem.indexOf(" - ") + 3);
        author = author.indexOf(":") === -1 ? "" : author.substring(0, author.indexOf(":"));
        let text = updatedItem.substring((author.length !== 0 ? (updatedItem.indexOf(author) + author.length) : (isMacVersion ? updatedItem.indexOf("]") + 1 : updatedItem.indexOf(" - ") + 2)) + 1);
        if (isMacVersion) text = text.substring(0, text.length - 1);
        return {
          text,
          author: author || getTranslatedItem("WhatsApp Notification"),
          date: updatedItem.substring(0, isMacVersion ? updatedItem.indexOf("]") : updatedItem.indexOf(" - ")),
          isMainUser: author.length !== 0 && author.trim() === (document.getElementById("userName") as HTMLInputElement).value
        }
      }));
    }
    /**
     * The number of bubbles that need to be saved in each HTML file
     */
    const step = +(document.getElementById("itemsPerFile") as HTMLInputElement).value > 0 ? +(document.getElementById("itemsPerFile") as HTMLInputElement).value : Infinity;
    for (let i = 0; i < Math.max(arrStorage.length, step); i += step) {
      /**
       * The container of all the bubbles
       */
      const container = document.createElement("div");
      /**
       * The object that will contain the base64 of the files added in this HTML file
       */
      const base64Storage: any = {};
      for (const { text, author, date, isMainUser } of arrStorage.slice(i, i + step)) {
        /**
         * WhatsApp sometimes puts the Left-to-Right or Right-to-Left Unicode character. We'll replace them only for looking to certain parts of the file.
         * We later replace also the no-break space, that for some reason is added on German and French WhatsApp exports
         */
        const textWithoutLeft = text.replace(/\u200e/g, "").replace(/\u200f/g, "").replace(/\r/, "").replace(/\u00a0/g, " ");

        /**
         * The chat bubble that'll be displayed for this message
         */
        const bubble = document.createElement("div");
        bubble.classList.add("bubble", isMainUser ? "flRight" : "flLeft");
        /**
         * The name of the person that has sent the message
         */
        const authorText = document.createElement("label");
        authorText.textContent = `${author} [${date}]`;
        authorText.classList.add("authorText");
        bubble.append(authorText);
        const allowedFiles = elements.filter(file => text.indexOf(file.name) !== -1);
        if (textWithoutLeft.startsWith(getTranslatedItem(" POLL:\n")) && textWithoutLeft.indexOf(getTranslatedItem("\nOPTION: ")) !== -1) {
          authorText.textContent += ` — ${getTranslatedItem("Autodetected poll")}`;
          /**
           * The div that'll contain the poll info
           */
          const pollContainer = document.createElement("div");
          pollContainer.classList.add("colorCard");
          /**
           * The title of the poll [ik, really useful documentation here]
           */
          const pollTitle = document.createElement("h3");
          const pollTitleText = text.substring(text.indexOf("\n") + 1);
          pollTitle.textContent = pollTitleText.substring(0, pollTitleText.indexOf("\n"));
          pollContainer.append(pollTitle);
          const optionArray = textWithoutLeft.split(getTranslatedItem("\nOPTION: ")).slice(1);
          /**
           * The total number of votes, calculated so that we can get the percentage of each option
           */
          const totalVotes = optionArray.reduce((prev, current) => {
            let optionNumber = current.substring(0, current.lastIndexOf(getTranslatedItem(" vote")));
            optionNumber = optionNumber.substring(optionNumber.lastIndexOf("(") + 1);
            return prev + +optionNumber.trim()
          }, 0);
          for (const option of optionArray) {
            let optionNumber = option.substring(0, option.lastIndexOf(getTranslatedItem(" vote")));
            optionNumber = optionNumber.substring(optionNumber.indexOf("(") + 1);
            const optionDiv = document.createElement("div");
            optionDiv.classList.add("pollOption");
            optionDiv.setAttribute("style", `background: linear-gradient(to right, var(--accent) ${+optionNumber.trim() * 100 / +totalVotes}%,var(--card) 0%);`); // We add the percentage of votes with the accent color
            optionDiv.textContent = option;
            pollContainer.append(optionDiv);
          }
          bubble.append(pollContainer);
          container.append(bubble);
        } else if (textWithoutLeft.startsWith(getTranslatedItem(" EVENT: ")) && textWithoutLeft.indexOf(getTranslatedItem("Event Start time")) !== -1 && textWithoutLeft.indexOf(getTranslatedItem("Event Cancelled:"))) {
          /**
           * The container for the event information
           */
          const eventContainer = document.createElement("div");
          eventContainer.classList.add("colorCard");
          authorText.textContent += ` — ${getTranslatedItem("Autodetected event")}`;
          /**
           * The title of the event [also here the documentation is really useful, but at least it helps to divide the code in smaller segments (?)]
           */
          let getTitle = textWithoutLeft.substring(getTranslatedItem(" EVENT: ").length);
          const startTime = getTitle.lastIndexOf(getTranslatedItem("\nEvent Start time:"));
          getTitle = getTitle.substring(0, startTime);
          const title = document.createElement("h3");
          title.textContent = getTitle;
          eventContainer.append(title);
          /**
           * Create an information div, with an 
           * @param type the icon to put at the left
           * @param text the text to show at the right
           * @param useLink if an Anchor element should be created
           * @returns the div to append
           */
          function createInfoDiv(type: keyof typeof icons, text: string, useLink?: boolean) {
            const div = document.createElement("div");
            div.classList.add("eventInfoContainer");
            const img = document.createElement("img");
            img.src = `data:image/svg+xml;base64,${window.btoa(icons[type].replace("#212121", (document.querySelector(`[data-color=accent]`) as HTMLInputElement).value))}`
            img.setAttribute("style", "width: 24px; height: 24px");
            const textParagraph = document.createElement(useLink ? "a" : "p");
            textParagraph.textContent = text;
            if (textParagraph instanceof HTMLAnchorElement) {
              textParagraph.href = text;
              textParagraph.target = "_blank";
            }
            div.append(img, textParagraph);
            return div;
          }
          /**
           * Get additional properties that are separated with a new line
           * @param lookFor the string that identifies the property
           * @returns the fetched property
           */
          function getAdditionalProps(lookFor: string) {
            let temp = textWithoutLeft.substring(textWithoutLeft.lastIndexOf(lookFor) + lookFor.length);
            if (temp.indexOf("\n") !== -1) temp = temp.substring(0, temp.indexOf("\n"));
            return temp;
          }
          eventContainer.append(title, createInfoDiv("calendarday", `${new Date(+getAdditionalProps(getTranslatedItem("\nEvent Start time: ")))}${text.substring(text.indexOf(getTranslatedItem("Event Cancelled: ")) + getTranslatedItem("Event Cancelled: ").length).startsWith("true") ? " — Cancelled" : ""}`));
          if (textWithoutLeft.indexOf(getTranslatedItem("Event Description: ")) !== -1) {
            let eventDescription = getAdditionalProps(getTranslatedItem("Event Description: "));
            (eventDescription.trim() !== "") && eventContainer.append(createInfoDiv("calendarinfo", eventDescription));
          }
          (textWithoutLeft.indexOf(getTranslatedItem("Event Join Link: ")) !== -1) && eventContainer.append(createInfoDiv("link", getAdditionalProps(getTranslatedItem("Event Join Link: ")), true));
          (textWithoutLeft.indexOf(getTranslatedItem("Event Location Name: ")) !== -1) && eventContainer.append(createInfoDiv("map", `${getAdditionalProps(getTranslatedItem("Event Location Name: "))}${text.indexOf(getTranslatedItem("Event Location Point: ")) !== -1 ? ` [${getAdditionalProps(getTranslatedItem("Event Location Point: "))}]` : ""}`));
          bubble.append(eventContainer);
          container.append(bubble);
        } else {
          for (const allowedFile of allowedFiles) { // Add the files in that text to the DOM
            if (!base64Storage[allowedFile.name] && (document.getElementById("base64Content") as HTMLSelectElement).value !== "relative") {
              base64Storage[allowedFile.name] = await new Promise((resolve) => { // Add the base64 file to the container, so that it can be saved 
                const read = new FileReader();
                read.onload = () => resolve(read.result);
                read.onerror = () => resolve("");
                read.readAsDataURL(allowedFile);
              });
            }
            let textSplit = text.split(allowedFile.name);
            const lastText = textSplit.pop(); // The text after the last reference to the file should be added at the end, since otherwise the bubble would be added one last time at the end.
            for (const textToKeep of textSplit) { // Here we'll create a label for the text before the file name, and then we'll add a div where the user can display/download the file
              const label = document.createElement("label");
              label.textContent = textToKeep;
              bubble.append(label);
              const extension = allowedFile.name.substring(allowedFile.name.lastIndexOf(".") + 1).toLowerCase();
              if (imageExtensions.indexOf(extension) !== -1 || videoExtensions.indexOf(extension) !== -1 || audioExtensions.indexOf(extension) !== -1) { // These media can be shown with HTMl5
                const img = document.createElement(videoExtensions.indexOf(extension) !== -1 ? "video" : audioExtensions.indexOf(extension) !== -1 ? "audio" : "img");
                const mimetype = `${img instanceof HTMLVideoElement ? "video" : img instanceof HTMLAudioElement ? "audio" : "image"}/${extension === "jpeg" ? "jpg" : extension === "mkv" ? "x-matroska" : extension === "mov" ? "quicktime" : extension}`;
                switch ((document.getElementById("base64Content") as HTMLSelectElement).value) {
                  case "htmlkeep": { // Add the Base64 item direclty in the HTML
                    img.src = base64Storage[allowedFile.name];
                    break;
                  }
                  case "jskeep": { // Add the Base64 only in JavaScript, so that space can be saved if the same file is sent multiple times
                    img.setAttribute("data-mimetype", mimetype);
                    img.setAttribute("data-file-base64src", allowedFile.name);
                    break;
                  }
                  default: { // Just add the file name
                    img.setAttribute("data-file-src", allowedFile.name);
                    break;
                  }
                }
                if (!(img instanceof HTMLImageElement)) img.controls = true;
                bubble.append(img);
              } else { // Create simple file div
                const fileDiv = document.createElement("a");
                fileDiv.classList.add("colorCard");
                fileDiv.textContent = allowedFile.name;
                switch ((document.getElementById("base64Content") as HTMLSelectElement).value) {
                  case "jskeep":
                    fileDiv.setAttribute(`data-file-base64src`, allowedFile.name);
                    break;
                  case "htmlkeep":
                    fileDiv.href = base64Storage[allowedFile.name];
                    fileDiv.download = allowedFile.name;
                    break;
                  default:
                    fileDiv.href = `./${allowedFile.name}`;
                    break;
                }
                bubble.append(fileDiv);
              }
            }
            // And now we'll add the text after the last reference to the file
            const label = document.createElement("label");
            label.textContent = lastText as string;
            bubble.append(label);
          }
          if (allowedFiles.length === 0) { // Create a label for all the text, since the loop before didn't run
            const label = document.createElement("label");
            label.textContent = text;
            bubble.append(label);
          }
          container.append(bubble);
        }
      }
      if ((document.getElementById("base64Content") as HTMLSelectElement).value === "jskeep") { // Add to the output HTML file the JSON object
        const jsonScript = document.createElement("script");
        jsonScript.textContent = JSON.stringify(base64Storage);
        jsonScript.type = "application/json"
        jsonScript.id = "base64";
        container.append(jsonScript);
      }
      await downloadFile(new Blob([`<!DOCTYPE html><head><meta charset="UTF-8"><style>${await ((await fetch("./style.css")).text())}</style><body style="${Array.from(document.querySelectorAll("[data-color]")).map(item => `--${item.getAttribute("data-color")}: ${(item as HTMLInputElement).value.replace(/\"/g, "'")}`).join(";")}">${container.outerHTML}<script>${await (((await fetch("./loadContent.js")).text()))}</script></body>`]), `[${i}-${Math.min(i + step, arrStorage.length)}] ${(document.getElementById("fileName") as HTMLInputElement).value || arrStorage.find(user => !user.isMainUser)?.author || arrStorage[0].author}.html`)
    }
    (document.getElementById("zipFile") as HTMLSelectElement).value === "zip" && downloadFile(await jsZip.generateAsync({ type: "blob" }), `${(document.getElementById("fileName") as HTMLInputElement).value || arrStorage.find(user => !user.isMainUser)?.author || arrStorage[0].author}.zip`, true);
  }
  /**
   * 
   * @param blob the Blob to download
   * @param name the suggested file name
   * @param force if the file must be downloaded using an HTML link, instead of adding it to a zip (if enabled by the user)
   */
  async function downloadFile(blob: Blob, name: string, force?: boolean) {
    if (!force && (document.getElementById("zipFile") as HTMLSelectElement).value === "zip") {
      jsZip.file(name, blob);
    } else if (!force && fileHandle) {
      const file = await fileHandle.getFileHandle(name, { create: true });
      const writable = await file.createWritable();
      await writable.write(blob);
      await writable.close();
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.text = name;
      a.click();
      const linkContainer = document.createElement("li");
      const deleteItem = document.createElement("label");
      deleteItem.textContent = "X";
      deleteItem.style.marginLeft = "10px";
      deleteItem.onclick = () => { linkContainer.remove(); URL.revokeObjectURL(a.href) }
      linkContainer.append(a, deleteItem);
      document.getElementById("redownloadList")?.append(linkContainer);
    }
  }
  (document.getElementById("folderPicker") as HTMLButtonElement).onclick = () => { // Choose a folder
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.webkitdirectory = true;
    input.onchange = () => {
      input.files && main(Array.from(input.files));
    }
    input.click();
  }
  for (const input of document.querySelectorAll("[data-color]")) (input as HTMLInputElement).value = getComputedStyle(document.body).getPropertyValue(`--${input.getAttribute("data-color")}`); // By default, make the default value of the data-color inputs the same as the properties that they edit
  (document.getElementById("zipPicker") as HTMLButtonElement).onclick = () => { // Get files directly from a zip file
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/zip";
    input.onchange = async () => {
      if (input.files) {
        const zip = (await import("jszip")).default;
        const file = new zip();
        await file.loadAsync(input.files[0]);
        const sendFile: UsedFileProps[] = [];
        for (const singleFile in file.files) sendFile.push(new File([await file.files[singleFile].async("blob")], singleFile));
        main(sendFile);
      }
    }
    input.click();
  }
  if (typeof window.showDirectoryPicker === "undefined") (document.getElementById("fileSystemApi") as HTMLOptionElement).style.display = "none";
  (document.getElementById("zipFile") as HTMLSelectElement).addEventListener("change", async () => {
    if ((document.getElementById("zipFile") as HTMLSelectElement).value === "fs") { // If the user has chosen to save the file using the File System API, get access to the directory
      try {
        if (typeof window.showDirectoryPicker !== "undefined") fileHandle = await window.showDirectoryPicker({ id: "WhatsappToHtml-OutputPicker", mode: "readwrite" }); else fileHandle = undefined;
      } catch (ex) {
        console.warn("No file selected!");
        fileHandle = undefined;
      }
    }
  })
  /**
   * Setup Selects that show or hide HTML parts
   */
  for (const select of document.querySelectorAll("[data-switch-id]")) {
    const attribute = select.getAttribute("data-switch-id"); // The ID of the Select element
    select.addEventListener("change", () => {
      for (const options of document.querySelectorAll(`[data-switch-ref="${attribute}"]`)) (options as HTMLElement).style.display = options.getAttribute("data-content") === (select as HTMLSelectElement).value ? "block" : "none"; // [data-switch-ref] indicates the divs that needs to be shown or hidden
    })
    select.dispatchEvent(new Event("change"));
  }
  for (const item of Array.from(document.querySelectorAll("#language > option")).map(item => (item as HTMLOptionElement).value)) { // We get all the available languages from the select. If the browser's language is one of these ones, it'll be automatically set.
    if (navigator.language.startsWith(item)) (document.getElementById("language") as HTMLSelectElement).value = item;
    break;
  }
  (document.getElementById("language") as HTMLSelectElement).value = navigator.language.startsWith("it") ? "it" : "en";
  /**
   * All the settings that will be stored in the LocalStorage
   */
  const settingsStorage = ["#userName", "#fileName", "#base64Content", "#itemsPerFile", "#zipFile", "#language", "[data-switch-id='exportSwitch']", ...Array.from(document.querySelectorAll("[data-color]")).map(item => `[data-color="${item.getAttribute("data-color")}"]`)];
  for (const item of settingsStorage) {
    const dom = document.querySelector(item) as HTMLInputElement;
    function changeEvent() {
      localStorage.setItem("WhatsAppHTML-Settings", JSON.stringify({ ...JSON.parse(localStorage.getItem("WhatsAppHTML-Settings") ?? "{}"), [item]: dom.value }));
    }
    for (const event of ["change", "input"]) dom.addEventListener(event, changeEvent);
  }
  /**
   * The previous edited settings, so that they can be restored
   */
  const getSettingsJson = JSON.parse(localStorage.getItem("WhatsAppHTML-Settings") ?? "{}");
  for (const key in getSettingsJson) (document.querySelector(key) as HTMLInputElement).value = getSettingsJson[key];
})()
