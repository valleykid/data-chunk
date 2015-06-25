data-chunk
========================

基于http/1.1-chunked + [async](https://github.com/caolan/async)实现的一种数据分块加载技术。

## Installation

Either through forking or by using [npm](https://www.npmjs.com) (the recommended way):

```{bash}
npm install data-chunk
```
And data-chunk will be installed in to your node-project.


## examples

```{js}
// ...
var dc = require('data-chunk');

app.get('/', function(req, res, next){
  res.render('index', function(error, html){
    res.write(html); //先加载页面框架dom，并开启chunked模式
    
    dc.response(res); //设置下dc所需要的response
    dc.dcseries({
		    one: function(callback){
		        setTimeout(function(){
		            callback(null, 1);
		        }, 200);
		    },
		    two: function(callback){
		        setTimeout(function(){
		            callback(null, 2);
		        }, 100);
		    }
		},
		function(err, results) {
			console.log(results);
			  //此时已经自动调用res.end()，不必显示加载
		    // results is now equal to: {one: 1, two: 2}
		});
  });
		
	//如果有前端库ICAT，数据会存放在ICAT.PAGEDATA中；如果无，则存放在window.PAGEDATA中
});
```

## Documentation

### Collections
同async的所有方法；

### Control Flow
同async的所有方法；
- dcseries: 同series
- dcparallel: 同parallel
- dcparallelLimit: 同parallelLimit
- dcwaterfall: 同waterfall
- dcauto: 同auto

> 以上方法会自动获取每条task数据，写入PAGEDATA

### Utils
同async的所有方法；

## License

MIT
