# WhatsApp-to-HTML

Export a WhatsApp chat to an HTML webpage that can be easily displayed

## How to use it:

Open the website: https://dinoosauro.github.io/WhatsApp-to-HTML/

In the first card, you can find instructions on how to get the .zip file
necessary to convert the WhatsApp chats to HTML. You can find them also here on
the README, after this section.

![The UI of WhatsApp-to-HTML](./readme_images/Screenshot%202024-07-31%20at%2012-29-40%20WhatsApp%20to%20HTML.png)

### Conversion options

Now, you need to choose the conversion options:

#### Name options:

- Your nickname on WhatsApp: this is used so that your messages will be put at
  the right of the page (instead of at the left)
- The output name of the file

#### Exportation options:

- If files should be embedded in the HTML file
  - By putting `Keep relative path for files`, the files won't be included in
    the HTML file. You'll need to place the HTML file in the same folder as the
    extracted zip file to see the pictures/videos/audios/files
  - By putting `Embed file content in JavaScript`, the files will be included in
    a JavaScript object. This means that the images/videos/audios/files can be
    displayed and downloaded even if you keep only the output HTML file
  - By putting `Embed file content in HTML (bigger file)`, the files will be
    included directly in the HTML. This will increase the file size, since
    sometimes the files are sent multiple times.
- You can choose to add _x_ messages per HTML file. In case the chat will have
  more than _x_ messages, multiple HTML files will be downloaded
- You can choose to download the file:
  - In the normal way, by direct download
  - As a single zip file (useful if you need to split multiple files)
  - By writing them directly on your File System (only on Chromium-based
    browsers)

#### Language options:

WhatsApp-to-HTML can show polls and events with a different UI. To do that,
you'll need to select the language of the WhatsApp app. If you've exported the
chat in an unsupported language, don't worry: you'll still have an HTML file,
and the polls/event will be written as text.

#### Choose files

Now, you can choose the folder (if you've extracted the zip file), or you can
upload the zip file directly.

### Stylesheet options

You can choose the colors and the font of the output HTML file

### Redownload files

All the files downloaded can be re-downloaded from this tab.

## Get the chat zip file

To use this tool, you'll need to export the chat as a zip file. Here you can
find the instructions to do that

### Android:

- Open the WhatsApp chat/group you want to export
- Click on the three dots at the top-right of the chat
- Click "More" -> "Export chat"
- Choose to save the media files, and save the .zip file somewhere

### iOS:

- Open the WhatsApp chat/group you want to export
- Tap the contact/group name, and then click on "Export chat"
- Choose to attach the media files, and save the .zip file somewhere

### macOS:

- Right-click on the WhatsApp chat/group you want to export
- Hover the "More" option, and then later click on the "Export chat" option
- Attach the media files. The zip file will be saved in the Downloads folder.

### Other devices:

You currently cannot export WhatsApp chat from the Windows and the Web version.
Please use a mobile device.

## Privacy

Everything is elaborated locally. Nothing is shared to an external server, and
you can run this tool offline by installing it as a Progressive Web App.
