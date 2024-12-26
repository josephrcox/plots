// @ts-nocheck
function compressAndEncode(jsonData) {
  const compressedData = pako.gzip(JSON.stringify(jsonData));
  const base64Data = btoa(String.fromCharCode.apply(null, compressedData));
  const urlSafeData = base64Data
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return urlSafeData;
}

function decodeAndDecompress(urlSafeData) {
  const base64Data = urlSafeData.replace(/-/g, "+").replace(/_/g, "/");
  const binaryStr = atob(base64Data);
  const charCodeArray = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    charCodeArray[i] = binaryStr.charCodeAt(i);
  }
  const decompressedData = pako.ungzip(charCodeArray, { to: "string" });
  return JSON.parse(decompressedData);
}

export async function compressMyGame() {
  let json = localStorage.getItem("plots_active_game_db");
  const compressedData = await compressAndEncode(json);

  const isLocal = window.location.hostname == "localhost";
  if (isLocal) {
    return "http://localhost:5173/?shareId=" + compressedData;
  } else {
    return "http://plots.jsph.cx/?shareId=" + compressedData;
  }
}

const windowParams = window.location.search
  .substring(1)
  .split("&")
  .reduce((acc, param) => {
    const [key, value] = param.split("=");
    acc[key] = value;
    return acc;
  }, {});

if (windowParams.shareId != undefined || windowParams.shareId != null) {
  console.log("DECRYPING FROM shareId");
  const sharedData = JSON.parse(decodeAndDecompress(windowParams.shareId));
  localStorage.setItem("plots_temp_game_db", JSON.stringify(sharedData));
  console.log("DECRYPED DATA", sharedData);
} else {
  localStorage.removeItem("plots_temp_game_db");
  console.log("COMPRESSING GAME TO SHARE");
  //   delete temp db
  compressMyGame();
}
