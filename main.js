// main.js

// DOM の取得
const fileInput = document.getElementById("file-input");
const fileInfo = document.getElementById("file-info");
const previewCanvas = document.getElementById("preview-canvas");
const previewCtx = previewCanvas.getContext("2d");
// iOS アイコン生成用
const btnGenerateIosMain = document.getElementById("btn-generate-ios-main");
const btnDownloadIosMain = document.getElementById("btn-download-ios-main");
const iosMainPreview = document.getElementById("ios-main-preview");
const iosMainMessage = document.getElementById("ios-main-message");

const btnGenerateIosSet = document.getElementById("btn-generate-ios-set");
const btnDownloadIosSet = document.getElementById("btn-download-ios-set");
const iosSetMessage = document.getElementById("ios-set-message");

// 512 アイコン用（生成＋DL）
const btnGenerate512 = document.getElementById("btn-generate-512");
const btnDownload512 = document.getElementById("btn-download-512");
const icon512Preview = document.getElementById("icon-512-preview");
const downloadMessage = document.getElementById("download-message");

// Android セット用
const btnGenerateAndroidSet = document.getElementById("btn-generate-android-set");
const btnDownloadAndroidSet = document.getElementById("btn-download-android-set");
const androidMessage = document.getElementById("android-message");

// カスタムサイズ用
const customSizeInput = document.getElementById("custom-size-input");
const btnGenerateCustom = document.getElementById("btn-generate-custom");
const btnDownloadCustom = document.getElementById("btn-download-custom");
const customPreviewImg = document.getElementById("custom-preview-img");
const customMessage = document.getElementById("custom-message");

// タブ切り替え用
const toolTabs = document.querySelectorAll(".tool-tab");
const toolSections = document.querySelectorAll(".tool-section");

// ===============================
// 背景透過ツール DOM & 状態
// ===============================
const bgStrengthRange = document.getElementById("bg-strength-range");
const bgStrengthText = document.getElementById("bg-strength-text");
const btnGenerateBgRemoved = document.getElementById("btn-generate-bg-removed");
const btnDownloadBg = document.getElementById("btn-download-bg");
const btnApplyBg = document.getElementById("btn-apply-bg");
const bgPreviewCanvas = document.getElementById("bg-preview-canvas");
const bgPreviewCtx = bgPreviewCanvas.getContext("2d");
const bgMessage = document.getElementById("bg-message");

let bgRemovedBlob = null;
let bgRemovedUrl = null;

// スライダーのラベル更新
function updateBgStrengthLabel() {
  const v = Number(bgStrengthRange.value) || 0;
  let label = "標準";
  if (v <= 30) label = "やさしめ（輪郭優先）";
  else if (v >= 70) label = "強め（背景をよく消す）";
  bgStrengthText.textContent = label;
}

updateBgStrengthLabel();
bgStrengthRange.addEventListener("input", updateBgStrengthLabel);



toolTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.toolTab;

    // タブの見た目
    toolTabs.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // パネルの表示切替
    toolSections.forEach((sec) => {
      sec.classList.toggle("active", sec.id === "tool-" + target);
    });
  });
});

const iosBgColorInput = document.getElementById("ios-bg-color");
const iosBgValue = document.getElementById("ios-bg-value");
const iosBgPresetButtons = document.querySelectorAll(".bg-preset-btn");

// iOS 背景色：プリセットボタン（白 / グレー）
iosBgPresetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const color = btn.dataset.bgColor;
    if (!color) return;

    iosBgColor = color;

    // ボタンの見た目を更新
    iosBgPresetButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // カラーピッカーと表示中のコードも揃える
    iosBgColorInput.value = color;
    iosBgValue.textContent = color.toUpperCase();
  });
});
// iOS 背景色：カラーピッカー
if (iosBgColorInput) {
  iosBgColorInput.addEventListener("input", () => {
    const color = iosBgColorInput.value || "#ffffff";
    iosBgColor = color;

    // プリセットボタンの「active」は一旦全部外す
    iosBgPresetButtons.forEach((b) => b.classList.remove("active"));

    iosBgValue.textContent = color.toUpperCase();
  });
}

// 元画像 & 512 アイコンの保持用
let originalImage = null;
let icon512Blob = null;
let icon512Url = null;
let androidZipBlob = null;   // ← 追加
let androidZipUrl = null;    // ← 追加
// 現在選択中の iOS 背景色（デフォルト白）
let iosBgColor = "#ffffff";  // ← 前回のやつ
let iosMainBlob = null;
let iosMainUrl = null;
let iosSetZipBlob = null;
let iosSetZipUrl = null;

let customBlob = null;
let customUrl = null;

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const btn = document.getElementById('install-btn');
    btn.style.display = 'inline-block';

    btn.addEventListener('click', () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        deferredPrompt.userChoice.then((choice) => {
            deferredPrompt = null;
        });
    });
});

// ==============================
// ファイル選択
// ==============================
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];

  if (!file) {
  fileInfo.textContent = "ファイルが未選択です";
  clearCanvas();
  originalImage = null;

  // 512関係
  btnGenerate512.disabled = true;
  btnDownload512.disabled = true;
  downloadMessage.textContent = "";
  icon512Preview.src = "";
  icon512Blob = null;
  if (icon512Url) {
    URL.revokeObjectURL(icon512Url);
    icon512Url = null;
  }

  // Android セット関係
  btnGenerateAndroidSet.disabled = true;
  btnDownloadAndroidSet.disabled = true;
  androidMessage.textContent = "";
  androidZipBlob = null;
  if (androidZipUrl) {
    URL.revokeObjectURL(androidZipUrl);
    androidZipUrl = null;
  }
    // iOS 1024アイコン
  btnGenerateIosMain.disabled = true;
  btnDownloadIosMain.disabled = true;
  iosMainMessage.textContent = "";
  iosMainPreview.src = "";
  iosMainBlob = null;
  if (iosMainUrl) {
    URL.revokeObjectURL(iosMainUrl);
    iosMainUrl = null;
  }

  // iOS 一式
  btnGenerateIosSet.disabled = true;
  btnDownloadIosSet.disabled = true;
  iosSetMessage.textContent = "";
  iosSetZipBlob = null;
  if (iosSetZipUrl) {
    URL.revokeObjectURL(iosSetZipUrl);
    iosSetZipUrl = null;
  }
    // カスタムサイズ
  btnGenerateCustom.disabled = true;
  btnDownloadCustom.disabled = true;
  customPreviewImg.src = "";
  customMessage.textContent = "";
  customBlob = null;
  if (customUrl) {
    URL.revokeObjectURL(customUrl);
    customUrl = null;
  }
    // 背景透過ツール
  btnGenerateBgRemoved.disabled = true;
  btnDownloadBg.disabled = true;
  btnApplyBg.disabled = true;
  bgRemovedBlob = null;
  if (bgRemovedUrl) {
    URL.revokeObjectURL(bgRemovedUrl);
    bgRemovedUrl = null;
  }
  bgPreviewCanvas.width = 1;
  bgPreviewCanvas.height = 1;
  bgMessage.textContent = "";


  return;
}

  fileInfo.textContent = `${file.name} / ${(file.size / 1024).toFixed(1)} KB`;
  downloadMessage.textContent = "";
  androidMessage.textContent = "";

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
   img.onload = () => {
  // 元画像ロード完了
  originalImage = img;
  drawPreview(img);

  // 512 の状態リセット
  btnGenerate512.disabled = false;
  btnDownload512.disabled = true;
  icon512Preview.src = "";
  icon512Blob = null;
  if (icon512Url) {
    URL.revokeObjectURL(icon512Url);
    icon512Url = null;
  }

  // Android セットもリセット（生成前状態）
  btnGenerateAndroidSet.disabled = false;
  btnDownloadAndroidSet.disabled = true;
  androidMessage.textContent = "Android アイコン一式はまだ生成されていません。";
  androidZipBlob = null;
  if (androidZipUrl) {
    URL.revokeObjectURL(androidZipUrl);
    androidZipUrl = null;
  }
    // iOS 用ボタンの初期状態
  btnGenerateIosMain.disabled = false;
  btnDownloadIosMain.disabled = true;
  iosMainPreview.src = "";
  iosMainBlob = null;
  if (iosMainUrl) {
    URL.revokeObjectURL(iosMainUrl);
    iosMainUrl = null;
  }
  iosMainMessage.textContent =
    "背景色を選んでから 1024×1024 アイコンを生成してください。";

  btnGenerateIosSet.disabled = true;
  btnDownloadIosSet.disabled = true;
  iosSetZipBlob = null;
  if (iosSetZipUrl) {
    URL.revokeObjectURL(iosSetZipUrl);
    iosSetZipUrl = null;
  }
  iosSetMessage.textContent =
    "まず 1024×1024 アイコンを確認してから、一式を作成するのがおすすめです。";
    // カスタムサイズ：元画像があれば生成できるように
  btnGenerateCustom.disabled = false;
  btnDownloadCustom.disabled = true;
  customPreviewImg.src = "";
  customBlob = null;
  if (customUrl) {
    URL.revokeObjectURL(customUrl);
    customUrl = null;
  }
  customMessage.textContent =
    "サイズを入力して「このサイズでアイコンを生成」を押してください。";
    // 背景透過ツール
  btnGenerateBgRemoved.disabled = false;
  btnDownloadBg.disabled = true;
  btnApplyBg.disabled = true;
  bgRemovedBlob = null;
  if (bgRemovedUrl) {
    URL.revokeObjectURL(bgRemovedUrl);
    bgRemovedUrl = null;
  }
  bgPreviewCanvas.width = 1;
  bgPreviewCanvas.height = 1;
  bgMessage.textContent =
    "背景の消し具合を調整して「背景透過画像を生成」を押してください。";

};

    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// ==============================
// プレビュー描画（元画像）
// ==============================
function drawPreview(img) {
  const maxSize = 180; // プレビュー用の最大表示サイズ

  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  previewCanvas.width = w;
  previewCanvas.height = h;

  previewCtx.clearRect(0, 0, w, h);
  previewCtx.drawImage(img, 0, 0, w, h);
}

function clearCanvas() {
  previewCanvas.width = 1;
  previewCanvas.height = 1;
}

// ==============================
// 汎用：正方形アイコンを作って Blob を返す
// ==============================
function createIconBlob(img, size, backgroundColor = null) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = size;
    canvas.height = size;

    const scale = Math.min(size / img.width, size / img.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const offsetX = (size - drawWidth) / 2;
    const offsetY = (size - drawHeight) / 2;

    // 背景処理
    if (backgroundColor) {
      // iPhone 用など：背景色で塗りつぶす（透過NG）
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, size, size);
    } else {
      // 透過を維持したい場合（Androidなど）
      ctx.clearRect(0, 0, size, size);
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Blob が作成できませんでした"));
          return;
        }
        resolve(blob);
      },
      "image/png",
      1.0
    );
  });
}


// ==============================
// 512×512 アイコン生成（プレビュー用）
// ==============================
btnGenerate512.addEventListener("click", async () => {
  if (!originalImage) {
    downloadMessage.textContent = "先に画像ファイルを選んでください。";
    return;
  }

  btnGenerate512.disabled = true;
  downloadMessage.textContent = "512×512 アイコンを作成中…";

  try {
    const blob = await createIconBlob(originalImage, 512);

    // 旧URLを掃除
    icon512Blob = blob;
    if (icon512Url) {
      URL.revokeObjectURL(icon512Url);
    }
    icon512Url = URL.createObjectURL(blob);

    // プレビュー表示
    icon512Preview.src = icon512Url;

    // DLボタン有効化
    btnDownload512.disabled = false;
    downloadMessage.textContent =
      "プレビューを確認して、問題なければダウンロードしてください。";
  } catch (err) {
    console.error(err);
    downloadMessage.textContent = "512×512 アイコンの作成に失敗しました。";
    btnGenerate512.disabled = false;
  }
});

// ==============================
// 512×512 アイコンを任意でダウンロード
// ==============================
btnDownload512.addEventListener("click", () => {
  if (!icon512Blob) {
    downloadMessage.textContent = "先に 512×512 アイコンを生成してください。";
    return;
  }

  const url = icon512Url || URL.createObjectURL(icon512Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "icon-512.png";
  document.body.appendChild(a);
  a.click();
  a.remove();

  downloadMessage.textContent =
    "512×512 アイコンのダウンロードが開始されました。";
});

// ==============================
// Android アイコン一式（ZIP）
// ==============================
// Android アイコン一式（ZIP）を生成（まだダウンロードしない）
btnGenerateAndroidSet.addEventListener("click", async () => {
  if (!originalImage) {
    androidMessage.textContent = "先に画像ファイルを選んでください。";
    return;
  }

  btnGenerateAndroidSet.disabled = true;
  androidMessage.textContent = "Android アイコン一式を作成中…";

  try {
    const zip = new JSZip();

    const sizes = [
      { size: 48,  name: "mipmap-mdpi-48.png" },
      { size: 72,  name: "mipmap-hdpi-72.png" },
      { size: 96,  name: "mipmap-xhdpi-96.png" },
      { size: 144, name: "mipmap-xxhdpi-144.png" },
      { size: 192, name: "mipmap-xxxhdpi-192.png" },
      { size: 512, name: "playstore-512.png" },
    ];

    for (const item of sizes) {
      const blob = await createIconBlob(originalImage, item.size);
      zip.file(item.name, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });

    // 状態に保持しておく
    androidZipBlob = zipBlob;
    if (androidZipUrl) {
      URL.revokeObjectURL(androidZipUrl);
    }
    androidZipUrl = URL.createObjectURL(zipBlob);

    // ダウンロードボタンを有効に
    btnDownloadAndroidSet.disabled = false;
    androidMessage.textContent =
      "Android アイコン一式の準備ができました。必要であればダウンロードしてください。";
  } catch (err) {
    console.error(err);
    androidMessage.textContent = "Android アイコン一式の作成に失敗しました。";
  } finally {
    btnGenerateAndroidSet.disabled = false;
  }
});
// Android アイコン一式（ZIP）を任意タイミングでダウンロード
btnDownloadAndroidSet.addEventListener("click", () => {
  if (!androidZipBlob) {
    androidMessage.textContent = "先に Android アイコン一式を生成してください。";
    return;
  }

  const url = androidZipUrl || URL.createObjectURL(androidZipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "android-icons.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();

  androidMessage.textContent =
    "Android アイコン一式のダウンロードが開始されました。";
});
// ==============================
// iOS 1024×1024 アイコン生成
// ==============================
btnGenerateIosMain.addEventListener("click", async () => {
  if (!originalImage) {
    iosMainMessage.textContent = "先に画像ファイルを選んでください。";
    return;
  }

  btnGenerateIosMain.disabled = true;
  iosMainMessage.textContent = "1024×1024 アイコンを作成中…";

  try {
    const blob = await createIconBlob(originalImage, 1024, iosBgColor);

    iosMainBlob = blob;
    if (iosMainUrl) {
      URL.revokeObjectURL(iosMainUrl);
    }
    iosMainUrl = URL.createObjectURL(blob);

    iosMainPreview.src = iosMainUrl;
    btnDownloadIosMain.disabled = false;
    btnGenerateIosSet.disabled = false; // 一式も作れるようにする

    iosMainMessage.textContent =
      "プレビューを確認して、問題なければダウンロードしてください。";
  } catch (err) {
    console.error(err);
    iosMainMessage.textContent = "1024×1024 アイコンの作成に失敗しました。";
  } finally {
    btnGenerateIosMain.disabled = false;
  }
});
btnDownloadIosMain.addEventListener("click", () => {
  if (!iosMainBlob) {
    iosMainMessage.textContent =
      "先に 1024×1024 アイコンを生成してください。";
    return;
  }

  const url = iosMainUrl || URL.createObjectURL(iosMainBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ios-icon-1024.png";
  document.body.appendChild(a);
  a.click();
  a.remove();

  iosMainMessage.textContent =
    "1024×1024 アイコンのダウンロードが開始されました。";
});
// ==============================
// iOS アイコン一式（ZIP）生成
// ==============================
btnGenerateIosSet.addEventListener("click", async () => {
  if (!originalImage) {
    iosSetMessage.textContent = "先に画像ファイルを選んでください。";
    return;
  }

  btnGenerateIosSet.disabled = true;
  iosSetMessage.textContent = "iOS アイコン一式を作成中…";

  try {
    const zip = new JSZip();

    // pt ベース + スケール
    const defs = [
      { base: 20, scales: [2, 3] },   // 通知
      { base: 29, scales: [2, 3] },   // 設定・検索
      { base: 40, scales: [2, 3] },   // Spotlight
      { base: 60, scales: [2, 3] },   // iPhone App
      { base: 76, scales: [2] },      // iPad App
      { base: 83.5, scales: [2] },    // iPad Pro
      { base: 1024, scales: [1] },    // App Store
    ];

    for (const def of defs) {
      for (const scale of def.scales) {
        const px = Math.round(def.base * scale);
        const filename =
          def.base === 1024
            ? "AppStore-1024.png"
            : `icon-${def.base}pt@${scale}x.png`;

        const blob = await createIconBlob(originalImage, px, iosBgColor);
        zip.file(filename, blob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });

    iosSetZipBlob = zipBlob;
    if (iosSetZipUrl) {
      URL.revokeObjectURL(iosSetZipUrl);
    }
    iosSetZipUrl = URL.createObjectURL(zipBlob);

    btnDownloadIosSet.disabled = false;
    iosSetMessage.textContent =
      "iOS アイコン一式の準備ができました。必要であればダウンロードしてください。";
  } catch (err) {
    console.error(err);
    iosSetMessage.textContent = "iOS アイコン一式の作成に失敗しました。";
  } finally {
    btnGenerateIosSet.disabled = false;
  }
});
btnDownloadIosSet.addEventListener("click", () => {
  if (!iosSetZipBlob) {
    iosSetMessage.textContent =
      "先に iOS アイコン一式を生成してください。";
    return;
  }

  const url = iosSetZipUrl || URL.createObjectURL(iosSetZipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ios-icons.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();

  iosSetMessage.textContent =
    "iOS アイコン一式（ZIP）のダウンロードが開始されました。";
});
// ==============================
// カスタムサイズ アイコン生成
// ==============================
btnGenerateCustom.addEventListener("click", async () => {
  if (!originalImage) {
    customMessage.textContent = "先に画像ファイルを選んでください。";
    return;
  }

  const raw = customSizeInput.value;
  const size = parseInt(raw, 10);

  if (Number.isNaN(size)) {
    customMessage.textContent = "サイズは数値で入力してください。";
    return;
  }
  if (size < 16 || size > 2048) {
    customMessage.textContent = "サイズは 16〜2048 の範囲で指定してください。";
    return;
  }

  btnGenerateCustom.disabled = true;
  customMessage.textContent = `${size}×${size} アイコンを作成中…`;

  try {
    // 透過維持（backgroundColor は null）
    const blob = await createIconBlob(originalImage, size, null);

    customBlob = blob;
    if (customUrl) {
      URL.revokeObjectURL(customUrl);
    }
    customUrl = URL.createObjectURL(blob);

    customPreviewImg.src = customUrl;
    btnDownloadCustom.disabled = false;

    customMessage.textContent =
      `${size}×${size} アイコンのプレビューです。問題なければダウンロードしてください。`;
  } catch (err) {
    console.error(err);
    customMessage.textContent = "カスタムサイズアイコンの作成に失敗しました。";
  } finally {
    btnGenerateCustom.disabled = false;
  }
});
btnDownloadCustom.addEventListener("click", () => {
  if (!customBlob) {
    customMessage.textContent =
      "先にカスタムサイズのアイコンを生成してください。";
    return;
  }

  const size = parseInt(customSizeInput.value || "0", 10) || "custom";
  const url = customUrl || URL.createObjectURL(customBlob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `icon-${size}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  customMessage.textContent =
    "カスタムサイズアイコンのダウンロードが開始されました。";
});
// ===============================
// 背景透過：ボタンイベント
// ===============================
btnGenerateBgRemoved.addEventListener("click", async () => {
  if (!originalImage) {
    bgMessage.textContent = "先に画像ファイルを選んでください。";
    return;
  }

  const strength01 = Number(bgStrengthRange.value || "50") / 100;

  btnGenerateBgRemoved.disabled = true;
  bgMessage.textContent = "背景を解析して透過処理をしています…";

  try {
    const { blob, canvas } = await removeBackground(originalImage, strength01);

    // ここで出来上がりcanvasとblobを保存
    bgRemovedBlob = blob;
    if (bgRemovedUrl) URL.revokeObjectURL(bgRemovedUrl);
    bgRemovedUrl = URL.createObjectURL(blob);

    // プレビュー：生成した canvas をそのまま描画
    bgPreviewCanvas.width = canvas.width;
    bgPreviewCanvas.height = canvas.height;
    bgPreviewCtx.clearRect(0, 0, canvas.width, canvas.height);
    bgPreviewCtx.drawImage(canvas, 0, 0);

    btnDownloadBg.disabled = false;
    btnApplyBg.disabled = false;
    bgMessage.textContent =
      "透過結果のプレビューです。問題なければダウンロードしてください。";
  } catch (err) {
    console.error(err);
    bgMessage.textContent = "背景透過の処理に失敗しました。";
  } finally {
    btnGenerateBgRemoved.disabled = false;
  }
});

// ダウンロード：生成済み blob をそのまま保存
btnDownloadBg.addEventListener("click", () => {
  if (!bgRemovedBlob || !bgRemovedUrl) {
    bgMessage.textContent =
      "先に「背景透過画像を生成」を実行してください。";
    return;
  }

  const a = document.createElement("a");
  a.href = bgRemovedUrl;
  a.download = "icon-transparent.png";
  document.body.appendChild(a);
  a.click();
  a.remove();

  bgMessage.textContent = "透過画像のダウンロードが開始されました。";
});

// この画像を元画像として使う
btnApplyBg.addEventListener("click", () => {
  if (!bgRemovedUrl) {
    bgMessage.textContent =
      "先に「背景透過画像を生成」を実行してください。";
    return;
  }

  const img = new Image();
  img.onload = () => {
    originalImage = img;
    drawPreview(img); // いつもの元画像プレビューを更新
    bgMessage.textContent =
      "この透過画像を元画像として設定しました。必要に応じてアイコンを再生成してください。";
  };
  img.src = bgRemovedUrl;
});


// ===============================
// 背景透過：背景色推定（四辺＋多数決）
// ===============================
function estimateBackgroundColor(imgData) {
  const { width, height, data } = imgData;

  const step = Math.max(1, Math.floor(Math.min(width, height) / 80));
  const samples = [];

  // 上下
  for (let x = 0; x < width; x += step) {
    const yTop = 0;
    const yBottom = height - 1;
    let iTop = (yTop * width + x) * 4;
    let iBottom = (yBottom * width + x) * 4;
    samples.push([data[iTop], data[iTop + 1], data[iTop + 2]]);
    samples.push([data[iBottom], data[iBottom + 1], data[iBottom + 2]]);
  }
  // 左右
  for (let y = 0; y < height; y += step) {
    const xLeft = 0;
    const xRight = width - 1;
    let iLeft = (y * width + xLeft) * 4;
    let iRight = (y * width + xRight) * 4;
    samples.push([data[iLeft], data[iLeft + 1], data[iLeft + 2]]);
    samples.push([data[iRight], data[iRight + 1], data[iRight + 2]]);
  }

  if (samples.length === 0) return { r: 255, g: 255, b: 255 };

  // ざっくり量子化して「一番多い色」を背景色にする
  const bucket = {};
  for (const [r, g, b] of samples) {
    const qr = Math.round(r / 16) * 16;
    const qg = Math.round(g / 16) * 16;
    const qb = Math.round(b / 16) * 16;
    const key = `${qr},${qg},${qb}`;
    bucket[key] = (bucket[key] || 0) + 1;
  }

  let bestKey = null;
  let bestCount = -1;
  for (const key in bucket) {
    if (bucket[key] > bestCount) {
      bestCount = bucket[key];
      bestKey = key;
    }
  }
  if (!bestKey) return { r: 255, g: 255, b: 255 };

  const [r, g, b] = bestKey.split(",").map((v) => parseInt(v, 10));
  return { r, g, b };


}

// ===============================
// 背景透過：フェザー付き本処理
// strength01: 0.0〜1.0
// ===============================
function removeBackground(img, strength01) {
  return new Promise((resolve, reject) => {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d", { willReadFrequently: true });

    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);

    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const { data, width, height } = imgData;

    const bg = estimateBackgroundColor(imgData);

    const innerBase = 12;
    const innerMax = 30;
    const outerBase = 35;
    const outerMax = 70; // ← MAX を少し弱め

    const inner = innerBase + (innerMax - innerBase) * strength01;
    const outer = outerBase + (outerMax - outerBase) * strength01;

    const inner2 = inner * inner;
    const outer2 = outer * outer;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 5) continue;

      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      // かなり暗い色（線っぽい）は残す
      if (brightness < 140) continue;

      const dr = r - bg.r;
      const dg = g - bg.g;
      const db = b - bg.b;
      const dist2 = dr * dr + dg * dg + db * db;

      if (dist2 <= inner2) {
        data[i + 3] = 0; // 完全透明
      } else if (dist2 < outer2) {
        const t = (dist2 - inner2) / (outer2 - inner2); // 0〜1
        const alphaFactor = Math.min(1, Math.max(0, t));
        data[i + 3] = Math.round(a * alphaFactor);
      }
    }

    // 境界の白フチを減らすため、α付きの色を少し暗くする
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3] / 255;
      if (a > 0 && a < 0.95) {
        data[i] = Math.round(data[i] * a);
        data[i + 1] = Math.round(data[i + 1] * a);
        data[i + 2] = Math.round(data[i + 2] * a);
      }
    }
    // === 最終アンチエイリアス補正（仕上がりをプレビューと一致させる） ===
for (let i = 0; i < data.length; i += 4) {
  let a = data[i + 3] / 255;

  // αが中途半端な境界だけ処理
  if (a > 0 && a < 1) {
    data[i] = Math.round(data[i] * a);
    data[i + 1] = Math.round(data[i + 1] * a);
    data[i + 2] = Math.round(data[i + 2] * a);
  }
}


    ctx.putImageData(imgData, 0, 0);

    c.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("背景透過の Blob を作成できませんでした"));
          return;
        }
        resolve({ blob, canvas: c });
      },
      "image/png",
      1.0
    );
  });
}



