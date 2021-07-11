import { ipcMain, app, BrowserWindow, dialog } from "electron";

import { writeFile } from "fs";

import electronIsDev from "electron-is-dev";
import { autoUpdater } from "electron-updater";

let isDev = electronIsDev;

if (!isDev) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = true;

  let confirmDialog: Electron.MessageBoxSyncOptions = {
    buttons: ["Remind Me Later", "Download Now"],
    message: "An update is available",
    defaultId: 1,
    title: "Update Dialog",
  };

  autoUpdater.checkForUpdates().then((r) => {
    if (
      r.updateInfo.version != autoUpdater.currentVersion.version &&
      dialog.showMessageBoxSync(confirmDialog) == 1
    ) {
      autoUpdater.downloadUpdate();
    }
  });
}

// try {
//   require("electron-reloader")(module);
// } catch (_) {}

var path = require("path");
let win: BrowserWindow;
ipcMain.handle(
  "saveTo",
  (
    ev,
    data,
    options = {
      title: "Save timestamps",
      default: "/",
      buttonLabel: "Save",
    }
  ) => {
    console.log("save");

    dialog.showSaveDialog(options).then((r) => {
      console.log(r.filePath);
      //@ts-ignore
      writeFile(r.filePath, data, (err) => {
        if (err) {
          console.error(err);
          return;
        }
      });
    });
    // ev.returnValue = path;
  }
);

ipcMain.on("getCurrentDir", (ev) => {
  ev.returnValue = __dirname;
});
ipcMain.on("getOpenPath", (ev, item, options) => {
  let r = dialog.showOpenDialog(options).then((r) => {
    console.log(r);
    ev.reply("path", item, r);
  });
});
ipcMain.on("getSavePath", (ev, item, options) => {
  let r = dialog.showSaveDialog(options).then((r) => {
    console.log(r);
    ev.reply("savePath", item, r);
  });
});

ipcMain.on("run", (ev, command) => {
  var spawnCommand = require("spawn-command"),
    child = spawnCommand(command);

  child.stdout.on("data", (d) => {
    console.log("data", String(d));
    ev.reply("data", String(d));
  });

  child.on("exit", (e) => {
    console.log("exit", String(e));
    ev.reply("exit", String(e));
  });
});

app.on("ready", () => {
  win = new BrowserWindow({
    icon: __dirname + "/icons/icon.png",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.maximize();
  let indexHTML = path.join(__dirname + "/menu/index.html");

  // indexHTML = path.join(__dirname + "/render/render.html");

  win.loadFile(indexHTML);
});
