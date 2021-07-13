# osspub
a npm tool that can upload files or directories to aliyun-oss server.

Please prepare an .osspub.json configuration file to configure your Endpoint, Appkey, and AppSecret.

.osspub.json file
```json
{
  "endpoint": "oss-cn-shenzhen.aliyuncs.com",
  "accessKeyId": "yourkeyid",
  "accessKeySecret": "yourkeysecret",
}
```

basic usage:
```bash
npm install --save osspub
```

```bash
osspub ${BUCKET_NAME} ${OSS_PATH} ${YOUR_FILE_OR_DIRECTORY}
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

the configure file also supports file blacklisting mode:
```json
{
  "excludes":[".DS_Store", ".svn"]
}
```

By default, osspub turns on the upload logging. You can turn it off with logoff = TURE
```json
{
  "logoff":true
}
```

Maybe sometimes, you only want to upload the files under the first level folder. So the configuration file also provides the limits of the level. By default, the limit is 20.
```json
{
  "nest":20
}
```

Osspub push files concurrently and asynchronously by using Promise.all, so that it can save handshake wait time.
you can configure this concurrent number by setting the 'batch' value, the default is 10
```json
{
  "batch":20
}
```

Osspub provides the ability to remove the prefix path.
```json
{
  "remove_prefix": true
}
```

The tool also provides a tagging function. You can set specific tags for special files or set default tags for all files.
```json
{
  "headers":
  {
    "some_files":{
      "x-oss-tagging": "TagA=A&TagB=B"
    },
    "default":{
      "x-default": "foo"
    }
  }
}
```

MIME configurations are similar to nginx configurations, see the following example.
```json
{
  "mime": {
      "types": {
          ".sk": "text/plain"
      }
  }
}
```
Hope you enjoy it.
