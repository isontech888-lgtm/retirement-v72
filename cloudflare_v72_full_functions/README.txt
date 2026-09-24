Cloudflare Pages 完整功能版 - 跟 Netlify 一樣功能
包含自動抓報價 + 自動抓10年/20年/成立至今 年化

部署方式 (不能用拖曳，要用 Git)：
1. 到 github.com 建立新 repo，例如 retirement-v72
2. 把這個資料夾的檔案上傳到 repo (index.html + functions/ 資料夾)
3. 到 Cloudflare Dash -> Workers & Pages -> Create application -> Pages -> Connect to Git
4. 選擇你的 repo，Build 設定不用改，直接 Deploy
5. 完成後就有完整功能，跟 Netlify 一樣

如果要用拖曳，就用另一個 pure static 版，但自動抓年化會用 proxy，比較不穩
