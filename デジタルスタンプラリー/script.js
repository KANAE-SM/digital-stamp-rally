    // 学科の情報
    const departments = [
      { id: "environment", name: "環境・建築", sub: "デザイン学科" },
      { id: "craft", name: "生産・工芸", sub: "デザイン学科" },
      { id: "visual", name: "ビジュアル", sub: "デザイン学科" },
      { id: "media", name: "メディア", sub: "芸術学科" }
    ];

    const STORAGE_KEY = "campusStampRally";
    const EXCHANGE_KEY = "campussStampRallyExchange";

    let stamps = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

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

        const status = document.createElement("div");
        status.className = "stamp-status";
        status.textContent = collected ? "取得済み" : "未取得";

        card.append(circle, name, sub, status);
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
        localStorage.getItem(EXCHANGE_KEY) !=="completed"
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

          showNotice(
            `${department.name}${department.sub}のスタンプを取得しました！`
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
      const notice = document.getElementById("notice");
      notice.textContent = message;
      notice.style.display = "block";
    }

    let html5QrCode;

    async function startScanner() {
      console.log("カメラ起動ボタンが押されました");

      const modal = document.getElementById("scanner-modal");
      const message = document.getElementById("scanner-message");

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
            } catch {
              message.textContent = "有効なQRコードではありません。";
              return; 
            }

            const department = departments.find(
              item => item.id === stampId
            );

            if (!department) {
              message.textContent = "このQRコードはスタンプラリー用ではありません。";
              return;
            }

            if (!stamps.includes(stampId)) {
              stamps.push(stampId);
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(stamps)
              );
              showNotice(
                `${department.name}${department.sub}のスタンプを取得しました！`
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
        message.textContent =
        "カメラが起動できません。:" + error.message;
      }
    }

    async function stopScanner() {
      if (html5QrCode && html5QrCode.isScanning) {
        await html5QrCode.stop();
        html5QrCode.clear();
      }

      document.getElementById("scanner-modal").hidden = true;
    }


    // 動作確認用
    function resetStamps() {
      if (!confirm("取得したスタンプをすべてリセットしますか？")) {
        return;
      }

      stamps = [];
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(EXCHANGE_KEY);

      document.getElementById("notice").style.display = "none";

      renderStamps();
      updateFinishedState();
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
  localStorage.setItem(EXCHANGE_KEY, "completed");

  document.getElementById("exchange").hidden = true;
  document.getElementById("exchange-complete").hidden = false;
}

function closeExchange() {
  document.getElementById("exchange").hidden = true;
}

function closeComplete() {
  document.getElementById("complete").hidden = true;
}

function closeExchangeComplete() {
  document.getElementById("exchange-complete").hidden = true;

  document.getElementById("notice").style.display = "none";

  updateFinishedState();
}

renderStamps();
checkQR();
updateFinishedState();
