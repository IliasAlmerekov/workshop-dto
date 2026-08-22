FROM composer:2 AS composer

FROM php:8.3-apache AS app

RUN a2enmod rewrite \
    && apt-get update && apt-get install -y --no-install-recommends libicu-dev unzip \
    && docker-php-ext-install intl opcache \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    # Kept as a template the entrypoint renders from on every start, never
    # edited in place — see docker/entrypoint.sh for why.
    && cp /etc/apache2/ports.conf /etc/apache2/ports.conf.template

COPY --from=composer /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock symfony.lock ./
RUN --mount=type=cache,target=/tmp/composer-cache \
    composer config -g cache-dir /tmp/composer-cache \
    && composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY . .

ENV APP_ENV=prod
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative \
    && composer run-script post-install-cmd \
    && mkdir -p var/cache var/log \
    && chown -R www-data:www-data var

COPY docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf.template
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["entrypoint.sh"]
CMD ["apache2-foreground"]
