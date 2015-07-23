File server
================

Simple file server for storing and serving files.

*WARNING* UNIX based function is used in the code!

```bash
git clone git@...
cd file-server
npm install
npm start
```

Some environment variables for configuration

```
FSRV_HOST - host:port definition of the host. default is 0.0.0.0:7071
FSRV_MAX_FIELDS - maximum fields on a post request. default is 100
FSRV_MAX_FILES - maximum files sending. default is 100
FSRV_MAX_FILE_SIZE - maximum file size in bytes. default 50Mb
FSRV_FREESPACE_LIMIT - minimum amount of free space left on hdd for upload denial in gigabytes. default is 50Gb
FSRV_UPLOAD_DIR - upload directory absolute path. default is __dirname/uploads
FSRV_SECURITY_KEY - you can set this variable to make access to server only via x-security-key header which must match this variable value
```