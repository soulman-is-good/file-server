File server
================

Simple file server for storing and serving files

```bash
git clone git@...
cd file-server
npm install
npm start
```

Some environment variables for configuration

```
FSRV_MAX_FIELDS - maximum fields on a post request. default is 100
FSRV_MAX_FILES - maximum files sending. default is 100
FSRV_MAX_FILE_SIZE - maximum file size in bytes. default 50Mb
FSRV_UPLOAD_DIR - upload directory absolute path. default is __dirname/uploads
```