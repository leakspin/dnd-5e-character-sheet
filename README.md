# Ada

RSS Reader using Webpack for compiling. This is just a test to use the magnificent and perfect boilerplate from [Erick Zhao](https://github.com/erickzhao/static-html-webpack-boilerplate).

## Config

Inside src/js, you have a [config.json.dist](/src/js/config.json.dist) that you have to fill in order to use the website correctly.  
First, go to [rss2json](https://rss2json.com/), get a (free) API key and write it on you brand new config.json file, copied from config.json.dist.  
And that's it! You can enjoy Ada with her own RSS sources: HackerNews and Menéame.

### Inserting a new RSS Feed
If you want to use your own RSS feed, you have to follow these steps:
1. Insert it on the config.json file from above.
```
"urls": {
    "mynewfeed": "https://example.com/rss"
}
```
2. Go to [HandlerManager.js](/src/js/handler/HandlerManager.js) and insert it on its constructor.
```
mynewfeed: new GenericHandler(),
```
3. (Optional) Develop a handler specific for the new feed. [GenericHandler.js](/src/js/handler/GenericHandler.js) pretty much covers everything but, for example, Menéame does have a special

## Acknowledgements

[rss2json](https://rss2json.com)  
Erick Zhao for the [static-html-webpack-boilerplate](https://github.com/erickzhao/static-html-webpack-boilerplate)  