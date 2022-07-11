# Nginx

## 模板

- main全局块：配置影响nginx全局的指令。一般有运行nginx服务器的用户组，nginx进程pid存放路径，日志存放路径，配置文件引入，允许生成worker process数等。
- events块：配置影响nginx服务器或与用户的网络连接。有每个进程的最大连接数，选取哪种事件驱动模型处理连接请求，是否允许同时接受多个网路连接，开启多个网络连接序列化等。
- http块：可以嵌套多个server，配置代理，缓存，日志定义等绝大多数功能和第三方模块的配置。如文件引入，日志自定义，连接超时时间，单连接请求数等。
- server块：配置虚拟主机的相关参数，一个http中可以有多个server。
- location块：配置请求的路由，以及各种页面的处理情况。

```
#配置用户或者组
#user www-data;
#允许生成的进程数
worker_processes 4;
#制定错误日志路径
error_log /home/yituadmin/mts2.1-ga/face_platform_runtime/log/nginx/error.log;
#指定nginx进程运行文件存放地址
pid /home/yituadmin/mts2.1-ga/face_platform_runtime/data/nginx/nginx.pid;
 
events {
    #单个work进程允许的最大连接数
    worker_connections 1024;
}
 
http {
    log_format with_time '$remote_addr - $remote_user [$time_local] '
                         '"$request" $status $bytes_sent '
                         '"$http_referer" "$http_user_agent" "$gzip_ratio" "$request_time" "$upstream_response_time"';
 
    map $time_iso8601 $logdate {
    '~^(?<ymd>\d{4}-\d{2}-\d{2})' $ymd;
    default                       'date-not-found';
    }
    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }
    access_log /home/yituadmin/mts2.1-ga/face_platform_runtime/log/nginx/access-$logdate.log;
    error_log /dev/null;
 
    client_body_temp_path /home/yituadmin/mts2.1-ga/face_platform_runtime/data/nginx/client_body_temp;
    fastcgi_temp_path /home/yituadmin/mts2.1-ga/face_platform_runtime/data/nginx/fastcgi_temp;
    proxy_temp_path /home/yituadmin/mts2.1-ga/face_platform_runtime/data/nginx/proxy_temp;
    scgi_temp_path /home/yituadmin/mts2.1-ga/face_platform_runtime/data/nginx/scgi_temp;
    uwsgi_temp_path /home/yituadmin/mts2.1-ga/face_platform_runtime/data/nginx/uwsgi_temp;
    #use NGINX to proxy static files
    # without 2 lines below the css proxies will not work
    # WARNING: mime.types should exists in the same folder!
    include       mime.types;
    default_type  application/octet-stream;
 
    server {
        #http start
        listen 11180;
        #        server_name 127.0.0.1;
        #http end
 
        #如果需要使用https, 需要注释掉 http start 到 http end 之间的内容，解注掉 https start 到 https end 中的内容
        #https start
        listen 11181 ssl;
        server_name 127.0.0.1;
        #这里可以使用绝对路径，制定对应的crt和key文件
        ssl_certificate ./crt.crt;
        ssl_certificate_key ./key.key;
 
        ssl_session_cache shared:SSL:20m;
        ssl_session_timeout 60m;
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
 
        # 强制浏览器使用https（只对域名有效）
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains;preload";
        #https end
 
        fastcgi_read_timeout 12000;
        fastcgi_buffers 16 8k;
        #keepalive_timeout  0;
        client_max_body_size 5120m;
        underscores_in_headers on;
 
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;                                                                                                         proxy_set_header X-Real-IP
        proxy_set_header REMOTE_ADDR $remote_addr;
 
        proxy_connect_timeout 300s;
        keepalive_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        send_timeout 300s;
 
 
        # etag control appered to be supported since NGINX 1.3.3
        # etag off;
 
        #mobile
        include mobile.conf;
 
        # inject:start
        location /face/v1/framework/platform_console/version {
            proxy_pass http://127.0.0.1:9900/face/v1/framework/platform_console/version;
        }
        # inject:end
 
       
        # React 站点资源
        location ^~ /web {
            # https特判
            if ($server_port = 11180) {
                rewrite ^(.*)/web(.*)$ https://$server_addr:11181/web$2 redirect;
            }
            proxy_pass http://127.1:8080/web;
            proxy_intercept_errors on;
            error_page 404 /web/index.html;
        }
 
        # 图像围栏使用的 FP 静态资源请求
        location ~ /fp/.*\.(js|css|png|jpg|ogg|otf|svg)$ {
            rewrite  ^/fp/(.*) /web/$1 last;
        }
 
        location / {
            #root ./shared/external_module/website/origin/webapps/web;
            #add_header Cache-Control private;
            #expires -1;
            #http
            #rewrite ^/(.*) http://$server_addr:11180/web/ redirect;
            #https
            rewrite ^/(.*) https://$server_addr:11181/web/ redirect;
        }
 
        # 仅针对 index.html 不缓存。 = 完全匹配 index.html;
        location = /index.html {
             root ./shared/external_module/website/origin/webapps/web;
 
             add_header Last-Modified $date_gmt;
             add_header Cache-Control 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
             if_modified_since off;
             expires off;
         }
 
 
 
        # Audio , Images and fonts will almost never modified
        # Therefore we cached these almost for forever
        location ~ /web/.*\.(png|jpg|jpeg|gif|ico|ttf|otf|woff|woff2|ogg|mp4|wav) {
            root ./shared/external_module/website/origin/webapps/web;
             
            # etag control appered to be supported since NGINX 1.3.3
            # etag off;
            #access_log on;
             
            # more_set_headers -s 404 -t 'ETag';
 
            # enables for version control
            # rewrite ^(.+)\.(\d+)\.(png|jpeg|gif|ico|ogg|wav|mp4|ttf|otf|woff|woff2)$ $1.$3;
             
            # more_clear_headers 'ETag';
            expires 3650d;
 
            # explicitly declare Cache-Control header
            # to enables caching fearure in this version (HTTP1.1)
            add_header Cache-Control public;
        }
 
        # JS CSS and HTML will cache for 1 month
        location ~ /web/.*\.(js|css|html)$ {
            root ./shared/external_module/website/origin/webapps/web;
             
            # etag control appered to be supported since NGINX 1.3.3
            # etag off;
            #access_log on;
             
            # more_set_headers -s 404 -t 'ETag';
            # rewrite ^(.+)\.(\d+)\.(js|css|png|jpe?g|gif|json|ogg|html|ttf|otf|woff|woff2)$ $1.$3;
            # more_clear_headers 'ETag';
            expires 30d;
 
            # explicitly declare Cache-Control header
            # to enables caching fearure in this version (HTTP1.1)
            add_header Cache-Control public;
        }
 
    }
 
}
```