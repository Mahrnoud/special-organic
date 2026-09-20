ARG PHP_BASE=php:8.4-apache-bookworm@sha256:0629e7852d88a0939841973910d94157de7cd68e48acefac44546f8534b45d31
FROM ${PHP_BASE} AS runtime
ARG APP_UID=10001
ARG APP_GID=10001
RUN php -r 'foreach (["pdo_sqlite", "mbstring", "fileinfo", "Zend OPcache"] as $extension) { if (!extension_loaded($extension)) { fwrite(STDERR, "Missing extension: $extension\n"); exit(1); } }' \
    && groupadd --gid "$APP_GID" app \
    && useradd --uid "$APP_UID" --gid "$APP_GID" --no-create-home app \
    && a2enmod headers \
    && sed -i 's/^Listen 80$/Listen 8080/' /etc/apache2/ports.conf \
    && cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY deploy/apache.conf /etc/apache2/sites-available/000-default.conf
COPY deploy/php.ini /usr/local/etc/php/conf.d/zz-special-organic.ini
WORKDIR /var/www/html
COPY api/ api/
COPY assets/ assets/
COPY tools/ tools/
COPY *.html ./
RUN mkdir -p database /var/lib/php/sessions \
    && chown app:app database assets/img/uploads /var/lib/php/sessions
ENV APACHE_RUN_USER=app APACHE_RUN_GROUP=app APACHE_PID_FILE=/tmp/apache2.pid \
    APACHE_RUN_DIR=/tmp/apache2 APACHE_LOCK_DIR=/tmp/apache2-lock
USER app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD php -r '$r = @file_get_contents("http://127.0.0.1:8080/index.html"); exit($r === false ? 1 : 0);'

FROM runtime AS test
USER root
RUN apt-get update && apt-get install -y --no-install-recommends python3 nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && printf 'session.cookie_secure=0\nsession.save_path=/tmp\n' > /usr/local/etc/php/conf.d/zzz-tests.ini
COPY tests/ tests/
USER app
CMD ["sh", "-c", "python3 -m unittest discover -s tests -v && node --test tests/test_storefront.cjs"]
