var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB,
  IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
  dbVersion = 1.0;

var database, db;

//打开数据库
//第一个参数是数据库名（打开即创建，没有其它独立的创建方法）
//其它参数以后解释
var database = indexedDB.open('ImageStorage', dbVersion);

//数据库初始化事件
database.onupgradeneeded = function(e) {
  //获取数据库对象
  db = e.target.result;
  //创建数据库实例
  //第一个是存储对象名，类似关系数据库的表名
  //第二个参数是主键名，还有其他选项，可以设置自增的
  var o = db.createObjectStore('PicData', {keyPath: 'id'});
};

//数据库打开成功事件
database.onsuccess = function(e) {
  //获取数据库对象
  //因为上面的初始化事件未必会被调用到，这里当然也得获取一次
  db = e.target.result;
  //这个doTransaction的参数是一个回调函数，可以把这个回调函数当作事物的过程使用
  db.doTransaction = function(f) {
    //从事务对象闪使用objectStore访问具体的存储对象，并把结果传给回调函数
    f(db.transaction('PicData', 'readwrite').objectStore('PicData'));
  };
};

// 将图片缓存的本地
function fetchImage(id, type) {
  var src = '';
  var imageId = id;
  if (type == 'small') {
    src = '../item/common/simpleImage.do?picId=' + id;
  } else {
    src = '../item/common/simpleImage.do?type=b&picId=' + id;
    imageId = id + 'blimg';
  }

  var elephant = document.getElementById(id);
  elephant.src = '../item/img/loading.gif';
  try {
    var readWriteMode = typeof IDBTransaction.READ_WRITE == 'undefined' ? 'readwrite' : IDBTransaction.READ_WRITE;
    var transaction = db.transaction(['PicData'], readWriteMode);

    var objectStore = transaction.objectStore('PicData');
    var request = objectStore.get(imageId);
    request.onsuccess = function(event) {
      var data = event.target.result;
      if (data == null) {
        // Create XHR
        var xhr = new XMLHttpRequest(),
          blob;

        xhr.open('GET', src, true);
        // Set the responseType to blob
        xhr.responseType = 'blob';

        xhr.addEventListener(
          'load',
          function() {
            if (xhr.status === 200) {
              // Blob as response
              blob = xhr.response;
              var imgFile = blob;

              // Get window.URL object
              var URL = window.URL || window.webkitURL;

              // Create and revoke ObjectURL
              var imgURL = URL.createObjectURL(imgFile);

              // Set img src to ObjectURL
              elephant.setAttribute('src', imgURL);

              // Revoking ObjectURL
              elephant.onload = function() {
                window.URL.revokeObjectURL(this.src);
              };
              // Save data in indexDB
              var picData = {};
              picData.id = imageId;
              picData.blob = blob;
              saveInIndexDB(picData);
            }
          },
          false
        );
        // Send XHR
        xhr.send();
      } else {
        console.log('Got image !');

        // Get window.URL object
        var URL = window.URL || window.webkitURL;

        // Create and revoke ObjectURL
        var imgURL = URL.createObjectURL(request.result.blob);

        // Set img src to ObjectURL
        Imagess(imgURL, id);
        //elephant.setAttribute("src", imgURL);

        // Revoking ObjectURL
        elephant.onload = function() {
          window.URL.revokeObjectURL(this.src);
        };
      }
    };
  } catch (e) {
    Imagess(src, id);
  }
}

function saveInIndexDB(picData) {
  //调用我们自己添加的方法来处理一个事务
  db.doTransaction(function(e) {
    e.add(picData);
  });
}

//判断是否加载完成
function Imagess(url, imgid) {
  var img = new Image();
  img.src = url;

  //判断浏览器
  var Browser = new Object();
  Browser.userAgent = window.navigator.userAgent.toLowerCase();
  Browser.ie = /msie/.test(Browser.userAgent);
  Browser.Moz = /gecko/.test(Browser.userAgent);

  if (Browser.ie) {
    img.onreadystatechange = function() {
      if (img.readyState == 'complete' || img.readyState == 'loaded') {
        document.getElementById(imgid).src = img.src;
      }
    };
  } else if (Browser.Moz) {
    img.onload = function() {
      if (img.complete == true) {
        document.getElementById(imgid).src = img.src;
      }
    };
  }
}

// 缓存数据
function getItemPicId(currentPage) {
  $.ajax({
    type: 'post',
    url: '../item/common/cacheItemPic.do',
    data: {currentPage: currentPage},
    dataType: 'json',
    error: function() {},
    success: function(data) {
      cacheItemPic(data.rows);
      total = data.total;
    }
  });
}

// 保存到本地
function cacheItemPic(data) {
  for (var i = 0; i < data.length; i++) {
    var src = '';
    var imageId = data[i].ST_PIC_ID;
    if (data[i].NM_SORT == '1') {
      src = '../item/common/simpleImage.do?picId=' + imageId;
      cacheImg(imageId, src);
    }
    src = '../item/common/simpleImage.do?type=b&picId=' + imageId;
    imageId = imageId + 'blimg';
    cacheImg(imageId, src);
  }

  function cacheImg(imgId, imgSrc) {
    try {
      var readWriteMode = typeof IDBTransaction.READ_WRITE == 'undefined' ? 'readwrite' : IDBTransaction.READ_WRITE;
      var transaction = db.transaction(['PicData'], readWriteMode);

      var objectStore = transaction.objectStore('PicData');
      var request = objectStore.get(imgId);
      request.onsuccess = function(event) {
        var data = event.target.result;
        if (data == null) {
          // Create XHR
          var xhr = new XMLHttpRequest(),
            blob;

          xhr.open('GET', imgSrc, true);
          // Set the responseType to blob
          xhr.responseType = 'blob';

          xhr.addEventListener(
            'load',
            function() {
              if (xhr.status === 200) {
                // Blob as response
                blob = xhr.response;
                var imgFile = blob;

                // Save data in indexDB
                var picData = {};
                picData.id = imgId;
                picData.blob = blob;
                saveInIndexDB(picData);
              }
            },
            false
          );
          // Send XHR
          xhr.send();
        } else {
          console.log('Got image !');
          objectStore.delete(imgId);
          console.log('delete data!');
          // Create XHR
          var xhr = new XMLHttpRequest(),
            blob;

          xhr.open('GET', imgSrc, true);
          // Set the responseType to blob
          xhr.responseType = 'blob';

          xhr.addEventListener(
            'load',
            function() {
              if (xhr.status === 200) {
                // Blob as response
                blob = xhr.response;
                var imgFile = blob;

                // Save data in indexDB
                var picData = {};
                picData.id = imgId;
                picData.blob = blob;
                saveInIndexDB(picData);
              }
            },
            false
          );
          // Send XHR
          xhr.send();
        }
      };
    } catch (e) {
      console.log('cache image error!');
    }
  }
}
