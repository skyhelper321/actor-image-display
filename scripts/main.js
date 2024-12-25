//初期化
Hooks.once("init", () => {
  //モジュールの設定に登録
  game.settings.register("actor-image-display", "shortcutPermission", {
    name: "ショートカット利用可能な権限",
    hint: "ショートカットを利用できる最小限のプレイヤー権限を設定します。",
    scope: "world",
    config: true,
    type: Number,
    default: 2, // Player
    choices: {
      1: "Observer",
      2: "Player",
      3: "Trusted Player",
      4: "Assistant GM",
      5: "Game Master"
    }
  });
  //キーバインディングの登録
  game.keybindings.register("actor-image-display", "openActorSelector", {
    name: "アクター選択ダイアログを開く",
    hint: "このショートカットキーを使用してアクター選択ダイアログを開きます。",
    editable: [{ key: "F9" }], // デフォルトのキー
    onDown: () => {
      // ショートカットキーが押されたときの処理
      const shortcutPermission = game.settings.get("actor-image-display", "shortcutPermission");
      if (game.user.role >= shortcutPermission) {
        showActorSelector();
        return true;
      }
      return false;
    },
    reservedModifiers: [],
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });
});

// socketlibにこのモジュールを登録
let displayImageSocket;
Hooks.once("socketlib.ready", () => {
  displayImageSocket = socketlib.registerModule("actor-image-display");
  displayImageSocket.register("updateActorImage", updateActorImage);
});

// アクターの画像を更新する関数
function updateActorImage(actorImg) {
  const imageContainer = document.getElementById("selected-actor-image");
  if (actorImg) {
    imageContainer.innerHTML = `<img src="${actorImg}" alt="Actor Image" />`;
  } else {
    imageContainer.innerHTML = ""; // Clear image
  }
}

// アクター画像を表示するためのコンテナを作成
Hooks.on("ready", () => {
  // Create and append the image container
  const imageContainer = document.createElement("div");
  imageContainer.id = "selected-actor-image";
  document.body.appendChild(imageContainer);
});

// アクター選択ダイアログを表示する関数
function showActorSelector() {
  const actorList = game.actors.contents.map(actor => ({
    id: actor.id,
    name: actor.name,
    img: actor.img
  }));
  actorList.push({ id: "none", name: "画像を表示しない", img: null });

  // ダイアログの中身（HTML）
  const dialogContent = `
    <form>
      <div class="form-group">
        <label for="actor-list">アクターを選択してください：</label>
        <select id="actor-list">
          ${actorList.map(actor => `<option value="${actor.id}">${actor.name}</option>`).join("")}
        </select>
      </div>
    </form>
  `;

  // ダイアログを表示
  new Dialog({
    title: "アクター画像選択",
    content: dialogContent,
    buttons: {
      ok: {
        label: "決定",
        callback: (html) => {
          const selectedActorId = html.find("#actor-list").val();
          const selectedActor = actorList.find(actor => actor.id === selectedActorId);
          if (selectedActor) {
            // socketlibを使用してすべてのクライアントに画像を更新するように指示
            displayImageSocket.executeForEveryone("updateActorImage", selectedActor.img);
          }
        }
      },
      cancel: {
        label: "キャンセル"
      }
    },
    default: "ok"
  }).render(true);
}