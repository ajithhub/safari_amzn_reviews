Amazon Book lookup
==================

This directory represents a simple Google App Engine server to service the book
review extension.

The Amazon Product API requires using your own secret keys and associate tag,
so it would be impractical to distribute that with the extension to make the
requests directly.


Configuration
-------------

If you want to host your own, then you need to fill in your info in the `amazon.yml` config file

It may look something like this (fake data here, of course):

```yaml
    ---
    access_key: 0A98928YPJ97G9MN6AT2
    secret_key: ffuLUFgm0Y1se46eDIvWOQZNeVtaIzRW57Q349QZ
    associate_tag: super-seller-20
    locale: us
```

