# RSA_AcousticSoftware

RSA Acoustic Software は、音響さんが一人でも  
音声ファイルの再生・エフェクト調整を可能にする  
Electron ベースのデスクトップアプリケーションです。  
音響効果や音量調整、リバーブやディレイなどの  
エフェクトを音声ごとに個別に設定できます。

今年のアドバンスクラス演劇時の音響さんの様子を見て  
パソコン操作の煩わしさを少しでも無くすため作成しました。  
要望次第で逐次アップデート予定です。

## ver 1.0.0 機能

- **フォルダ選択**: 音声ファイルを含むフォルダを選択し、アプリ内で一覧表示
- **再生・一時停止**: 各音声ファイルごとに再生・一時停止が可能
- **音量調整**: 各音声ファイルに対して音量を個別に調整可能
- **エフェクト設定**: リバーブ、ディレイ、エコーなどのエフェクトを設定し、リアルタイムに反映
- **再生位置の確認**: シークバーで現在の再生位置と全体の長さを確認可能

## インストール

1. **リポジトリをクローン**:
   ```bash
   git clone https://github.com/your-username/RSA_AcousticSoftware.git
   cd RSA_AcousticSoftware
   ```
2. **依存関係のインストール**:
   ```bash
   npm install
   ```
3. **アプリの起動**:
   ```bash
   npm start
   ```

## ビルド

このアプリを実行可能な`.exe`ファイルとしてビルドするには、以下の手順に従ってください。

1. electron-builder をインストール:
   ```bash
   npm install electron-builder --save-dev
   ```
2. ビルドの実行:
   ```bash
   npm run dist
   ```

## 開発環境

- Electron: v13.1.7
- Node.js: v14 以上
- npm: v6 以上

## ライセンス

このプロジェクトは MIT ライセンスのもとで公開されています。  
詳細は[LICENSE.json](./LICENSES.json)ファイルをご確認ください。
