express-promisified
-------------------

Express with promises

### HTTPS Support

1. Create a `.crt` and `.key` in the app using this module

```bash
openssl genrsa 2048 > localhost.key
chmod 400 localhost.key
openssl req -new -x509 -nodes -sha256 -days 365 -key localhost.key -out localhost.crt
```

2. Press `enter` through all fields

```
Country Name (2 letter code) []:
State or Province Name (full name) []:
Locality Name (eg, city) []:
Organization Name (eg, company) []:
Organizational Unit Name (eg, section) []:
Common Name (eg, fully qualified host name) []:
Email Address []:
```

3. When calling `listenHTTPS` you will need to pass the cert and key

```javascript
import fs from 'fs';
// const fs = require(fs);

...

const port = process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : 8443;
const privateKey = fs.readFileSync('./creds/localhost.key');
const certificate = fs.readFileSync('./creds/localhost.crt');

...

server.listenHTTPS({ port, privateKey, certificate })
```