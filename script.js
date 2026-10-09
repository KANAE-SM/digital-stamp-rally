    // 学科の情報
    const departments = [
      { id: "environment", name: "環境・建築", sub: "デザイン学科", building: "5号館" },
      { id: "craft", name: "生産・工芸", sub: "デザイン学科", building: "6号館" },
      { id: "visual", name: "ビジュアル", sub: "デザイン学科", building: "7号館" },
      { id: "media", name: "メディア", sub: "芸術学科", building: "8号館" }
    ];

    const STORAGE_KEY = "campusStampRally";
    const EXCHANGE_KEY = "campussStampRallyExchange";
    const HOWTO_KEY = "campussStampRallyHowto";

    let stamps = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    function startStampRally() {
      localStorage.setItem(HOWTO_KEY, "seen");

      document.getElementById("howto-screen").hidden = true;

      const exchangeComplete =
      localStorage.getItem(EXCHANGE_KEY) === "completed";

      const stampCount = stamps.length;

      if (exchangeCompleted) {
        document.getElementById("exchange-complete").hidden = false;
      } else if (stampCount === departments.length) {
        document.getElementById("exchange").hidden = false;
      } else {
        document.getElementById("complete").hidden = true;
        renderStamps();
      }
    }

    // スタンプ帳を画面に表示
    function renderStamps() {
      const grid = document.getElementById("stamp-grid");
      grid.innerHTML = "";

      departments.forEach((department) => {
        const collected = stamps.includes(department.id);

        const card = document.createElement("div");
        card.className = "stamp-card" +
          (collected ? " collected" : "");

        const circle = document.createElement("div");
        circle.className = "stamp-circle";
        
        if(collected) {
          const image = document.createElement("img");
          image.src = `stamp/${department.id}.png`;
          image.alt = `${department.name}のスタンプ`;
          circle.appendChild(image);
        } else {
          circle.textContent = "＋";
        }

        const name = document.createElement("div");
        name.className = "stamp-name";
        name.textContent = department.name;

        const sub = document.createElement("div");
        sub.className = "stamp-name";
        sub.textContent = department.sub;

        const building = document.createElement("div");
        building.className = "stamp-building";
        building.textContent = department.building;

        const status = document.createElement("div");
        status.className = "stamp-status";
        status.textContent = collected ? "取得済み" : "未取得";

        card.append(circle, name, sub, building, status);
        grid.appendChild(card);
      });

      const count = stamps.length;
      document.getElementById("progress-text").textContent =
        `${count} / ${departments.length}`;

      document.getElementById("progress-bar").style.width =
        `${count / departments.length * 100}%`;

      const complete = document.getElementById("complete");
      const exchange = document.getElementById("exchange");
      const closeExchangeComplete = document.getElementById("exchange-complete");

      if(
        count === departments.length &&
        exchange.hidden &&
        closeExchangeComplete.hidden &&
        localStorage.getItem(EXCHANGE_KEY) !=="completed" &&
        document.getElementById("stamp-get").hidden
      ) {
        complete.hidden = false;
      } else {
        complete.hidden = true;
      }

      updateFinishedState();
    }

    // QRコードのURLからスタンプを取得
    function checkQR() {
      const params = new URLSearchParams(location.search);
      const stampId = params.get("stamp");

      if (!stampId) return;

      const department = departments.find(
        item => item.id === stampId
      );

      if (department) {
        if (!stamps.includes(stampId)) {
          stamps.push(stampId);
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(stamps)
          );

          showStampGet(
            department,
          stamps.length === departments.length
        );

        } else {
          showNotice("このスタンプは取得済みです！");
        }
      } else {
        showNotice("有効なスタンプ情報が見つかりませんでした。");
      }

      // URLから取得用パラメータを取り除く
      history.replaceState(
        null,
        "",
        location.pathname
      );

      renderStamps();
    }

    function showNotice(message) {
      const popup = document.getElementById("stamp-notice");
      const title = document.getElementById("stamp-notice-title");
      const text = document.getElementById("stamp-notice-message");

      title.textContent = "取得済み";
      text.textContent = message;

      popup.hidden = false;

      popup.classList.remove("show");
      void popup.offsetWidth;
      popup.classList.add("show");

      setTimeout(() => {
        popup.classList.remove("show");
        popup.hidden = true;
      }, 5000);
    }

    function showStampGet(department, isComplete = false) {
      const popup = document.getElementById("stamp-get");
      const name = document.getElementById("stamp-get-name");

      name.innerHTML =
        `<span class="department-name ${department.id}">${department.name}${department.sub}</span>の<br>
        スタンプを取得しました！`;

      popup.hidden = false;

      popup.classList.remove("show");
      void popup.offsetWidth;
      popup.classList.add("show");

      setTimeout(() => {
        popup.classList.remove("show");
        popup.hidden = true;

        if (isComplete) {
          document.getElementById("complete").hidden = false;
        }
      }, 3000); 
    }

    let html5QrCode;

    async function startScanner() {
      console.log("カメラ起動ボタンが押されました");

      const modal = document.getElementById("scanner-modal");
      const message = document.getElementById("scanner-message");

      document.getElementById("camera-help").hidden = true;

      modal.hidden = false;
      message.textContent = "カメラを起動しています…";

      try{
        html5QrCode = new Html5Qrcode("reader");

        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250} },
          async (decodedText) => {
            let stampId;

            try {
              const url = new URL(decodedText);
              stampId = url.searchParams.get("stamp");

              message.textContent =
              "読み取ったURL : " + decodedText +
              "\n取得したstamp : " + stampId;
            } catch {
              message.textContent = "有効なQRコードではありません。";
              return; 
            }

            const department = departments.find(
              item => item.id === stampId
            );

            if (!department) {
              message.textContent = "このQRコードはスタンプラリー用ではありません。\n" +
              "読み取ったURL : " + decodedText + "\n" +
              "取得したstamp : " + stampId;
              return;
            }

            if (!stamps.includes(stampId)) {
              stamps.push(stampId);
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(stamps)
              );

              showStampGet(
                department,
                stamps.length === departments.length
              );

            } else {
              showNotice("このスタンプは取得済みです！");
            }

            renderStamps();
            await stopScanner();
          }
        );

        message.textContent = "QRコードを枠内に映してください。";
      } catch (error) {
        console.error("カメラ起動エラー:", error);
        message.textContent = "";
        document.getElementById("camera-help").hidden = false;
      }
    }

    async function stopScanner() {
      if (html5QrCode && html5QrCode.isScanning) {
        await html5QrCode.stop();
        html5QrCode.clear();
      }

      document.getElementById("scanner-modal").hidden = true;
    }


function updateFinishedState() {
  const finished =
    localStorage.getItem(EXCHANGE_KEY) === "completed";

  const scanButton = document.getElementById("scan-button");
  const finishedMessage =
    document.getElementById("finished-message");

  if (finished) {
    scanButton.disabled = true;
    scanButton.textContent = "引き換え済み";
    finishedMessage.hidden = false;
  } else {
    scanButton.disabled = false;
    scanButton.textContent = "QRコードを読み取る";
    finishedMessage.hidden = true;
  }
}

function showExchange() {
  document.getElementById("complete").hidden = true;
  document.getElementById("exchange").hidden = false;
}

function completeExchange() {
  const button = document.querySelector("#exchange .complete-button");
  const stamp = document.querySelector(".complete-stamp");

  if(localStorage.getItem(EXCHANGE_KEY) === "completed") {
    return;
  }

  localStorage.setItem(EXCHANGE_KEY, "completed");

  button.disabled = true;
  button.textContent = "引き替え処理...";

  stamp.classList.remove("stamp-pop");

  void stamp.offsetWidth;

  stamp.classList.add("stamp-pop");

  setTimeout(() => {  
  document.getElementById("exchange").hidden = true;
  document.getElementById("exchange-complete").hidden = false;
  }, 3000);
}

function closeComplete() {
  document.getElementById("complete").hidden = true;
}

function closeExchangeComplete() {
  document.getElementById("exchange-complete").hidden = true;

  updateFinishedState();
}

const howtoStartButton = document.getElementById("howto-start-button");

if (localStorage.getItem(HOWTO_KEY) === "seen") {
  howtoStartButton.textContent = "つづきから";
} else {
  howtoStartButton.textContent = "START"
}

renderStamps();
checkQR();
updateFinishedState();
