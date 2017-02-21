# slack-ec2-sample

`slack` というキー名のタグが付与されたインスタンスをslack経由で起動、停止できるようにします。  
slack の Outgoing Webhooks からAPIGatewayを呼出します。

`$server help`  
`$server status`  
`$server [tag name] stop`  
`$server [tag name] start`  

## 利用ツール
* serverless framework v1.7.0
* nodejs 4.3.2
* slack

## setup

```
% git clone https://github.com/quartette/slack-ec2-sample.git
% cd slack-ec2-sample
% npm install
% serverless deploy -s dev
```
