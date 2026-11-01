# Nordic Honeymoon Trip 2026

## 部署到 GitHub Pages

1. 將 `index.html` 放在 GitHub repository 根目錄（或你設定的 Pages publishing source 目錄）。
2. GitHub → Settings → Pages。
3. Build and deployment 選 `Deploy from a branch`。
4. Branch 選 `main`，資料夾選 `/ (root)`，按 Save。
5. 等待 Actions / Pages 部署完成，使用 `https://<GitHub帳號>.github.io/<repo名稱>/` 開啟。

## Git 指令

```bash
git add index.html README.md
git commit -m "Update Nordic honeymoon travel app"
git push origin main
```

若尚未 clone：

```bash
git clone https://github.com/<GitHub帳號>/<repo名稱>.git
cd <repo名稱>
# 將 index.html 與 README.md 放入此目錄
git add .
git commit -m "Add Nordic honeymoon travel app"
git push -u origin main
```

## 本版內容與限制

- 純靜態 HTML/CSS/JavaScript，無需 Node、資料庫或後端，可直接部署 GitHub Pages。
- 每一天獨立切換；手機版以日期下拉選單切換，桌面版提供日程側欄。
- 公車／交通卡片使用高對比色顯示上車與下車站。
- 路線按鈕會將起訖地點帶入 Google Maps 大眾運輸規劃。
- 各交通 App 提供 iPhone App Store／官方網站入口。部分 App 沒有公開支援預填站點、日期的 deep link，因此不偽造此功能。
- 原始行程沒有提供的路線號碼、部分站點、飯店地址與班次會標示待確認。
- 票價與時刻表可能變動；請以出發當日業者資訊為準。
