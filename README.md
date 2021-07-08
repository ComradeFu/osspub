# osspub
a npm tool that can upload files or directories to aliyun-oss server.

Please prepare an .osspub configuration file to configure your Endpoint, Appkey, and AppSecret.

.osspub file
```json
{
  "endpoint": "oss-cn-shenzhen.aliyuncs.com",
  "accessKeyId": "yourkeyid",
  "accessKeySecret": "yourkeysecret",
}
```

In addition, the priority of a given file can be determined in the configuration file. 
By default all files have infinitely high priority. 
If you specify the priority of certain files, these files will be uploaded after others, and they will be uploaded according to their priority. 
higher pri will be uploaded first.

example
```json
{
  "files_pri":
  {
    "index.html":0,
    "index.js":1,
    "version.json":2,
  }
}
```

usage:
```bash
npm install --save osspub
```

```bash
osspub ${YOUR_FILE_OR_DIRECTORY}
```
