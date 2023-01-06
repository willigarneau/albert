require("update-electron-app")();

const { menubar } = require("menubar");

const path = require("path");
const {
  app,
  Tray,
  Menu,
  globalShortcut,
  shell,
  nativeImage,
} = require("electron");
const contextMenu = require("electron-context-menu");

const image = nativeImage.createFromPath(path.join(__dirname, "assets", "robot-16.png"));

app.on("ready", () => {
  const tray = new Tray(image);

  const menuBar = menubar({
    browserWindow: {
      icon: image,
      webPreferences: {
        webviewTag: true,
        nativeWindowOpen: true,
      },
      width: 400,
      height: 600,
    },
    tray,
    showOnAllWorkspaces: true,
    preloadWindow: true,
    showDockIcon: true,
    icon: image,
  });

  menuBar.on("ready", () => {
    const { window } = menuBar;


    if (process.platform !== "darwin") {
      window.setSkipTaskbar(true);
    } else {
      app.dock.hide();
    }

    const contextMenuTemplate = [
      {
        label: "Quit",
        accelerator: "Command+Q",
        click: () => { app.quit(); },
      },
      {
        label: "Reload",
        accelerator: "Command+R",
        click: () => {
          window.reload();
        },
      },
      {
        label: "Open in browser",
        click: () => {
          shell.openExternal("https://chat.openai.com/chat");
        },
      },
      {
        type: "separator",
      },
    ];

    tray.on("right-click", () => {
      menuBar.tray.popUpContextMenu(Menu.buildFromTemplate(contextMenuTemplate));
    });

    globalShortcut.register("CommandOrControl+Shift+g", () => {
      if (window.isVisible()) {
        menuBar.hideWindow();
      } else {
        menuBar.showWindow();
        if (process.platform == "darwin") {
          menuBar.app.show();
        }
        menuBar.app.focus();
      }
    });

    const menu = new Menu();
    Menu.setApplicationMenu(menu);

    console.log("ready")
  });

  app.on("web-contents-created", (e, contents) => {
    if (contents.getType() == "webview") {
      contents.on("new-window", (e, url) => {
        e.preventDefault();
        shell.openExternal(url);
      });
      contextMenu({
        window: contents,
      });

      contents.on("before-input-event", (_, input) => {
        const { control, meta, key } = input;
        if (!control && !meta) return;

        // convert upper lines to switch case
        switch (key) {
          case "c":
            contents.copy();
            break;
          case "v":
            contents.paste();
            break;
          case "a":
            contents.selectAll();
            break;
          case "z":
            contents.undo();
            break;
          case "y":
            contents.redo();
            break;
          case "q":
            app.quit();
            break;
          case "r":
            contents.reload();
            break;
        }
      });
    }
  });

  if (process.platform == "darwin") {
    menuBar.on("after-hide", () => {
      menuBar.app.hide();
    });
  }

  app.commandLine.appendSwitch(
    "disable-backgrounding-occluded-windows",
    "true"
  );
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
