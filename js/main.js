'use strict';
(function() {
  function ImageStorage(imgs) {
    const indexedDB =
      window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
    this.IDBTransaction =
      window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;
    const dbVersion = 1.0;
    this.storeName = 'ImageStore';
    this.readWriteMode = typeof IDBTransaction.READ_WRITE === 'undefined' ? 'readwrite' : IDBTransaction.READ_WRITE;
    // Create/open database
    this.opendbReauest = indexedDB.open('ImageDB', dbVersion);
    //数据库初始化成功
    this.opendbReauest.onsuccess = e => {
      console.log('Success creating/accessing IndexedDB database');
      let db = e.target.result;
      this.db = db;
      // Interim solution for Google Chrome to create an objectStore. Will be deprecated
      if (db.setVersion) {
        if (db.version != dbVersion) {
          var setVersion = db.setVersion(dbVersion);
          setVersion.onsuccess = () => {
            this.createObjectStore(db);
            this.getImageFiles(imgs);
          };
        } else {
          this.getImageFiles(imgs);
        }
      } else {
        this.getImageFiles(imgs);
      }
    };
    //数据库初始化事件，与前一次数据库版本不一致时触发
    this.opendbReauest.onupgradeneeded = e => {
      console.log('indexDB event:onupgradeneeded');
      this.createObjectStore(e.target.result);
    };
    this.opendbReauest.onerror = function(event) {
      console.log('Error creating/accessing IndexedDB database');
    };
  }
  ImageStorage.prototype = {
    /**
     * 创建存储空间
     * @param  {Object} dataBase
     */
    createObjectStore(dataBase) {
      // Create an objectStore
      console.log('Creating ImageStore');
      if (!dataBase.objectStoreNames.contains(this.storeName)) {
        const objectStore = dataBase.createObjectStore(this.storeName, {keyPath: 'id'});
        //建立索引-索引名称、对应属性、配置项
        objectStore.createIndex('id', 'id', {unique: true});
      }
    },
    getImageFiles(imgs) {
      imgs.forEach(img => this.getImageFile(img));
    },
    getImageFile(imgSrc) {
      // Create XHR
      var xhr = new XMLHttpRequest(),
        blob;
      xhr.open('GET', imgSrc, true);
      xhr.responseType = 'blob';
      xhr.addEventListener(
        'load',
        () => {
          if (xhr.status === 200) {
            console.log('Image retrieved');
            blob = xhr.response;
            // Put the received blob into IndexedDB
            this.put({
              id: imgSrc,
              blob
            });
          }
        },
        false
      );
      // Send XHR
      xhr.send();
    },
    /**
     * 生成事务对象
     */
    objectStore() {
      return this.db.transaction(this.storeName, this.readWriteMode).objectStore(this.storeName);
    },
    /**
     * 获取数据
     * @param  {String}   key
     * @param  {Function} callback
     */
    getValue(key, callback) {
      const request = this.objectStore().get(key);
      request.onerror = e => {
        console.log('Can not get value', e);
      };
      request.onsuccess = e => {
        callback(e.target.result);
      };
    },
    /**
     * 插入或更新数据
     * @param  {Object} value
     * @param  {String} key
     */
    put(value, key) {
      console.log('Putting data');
      const request = this.objectStore().put(value);
      request.onerror = e => {
        console.log(`error in put key:${key}`, e);
      };
    },
    /**
     * 删除数据
     * @param  {String} key
     */
    remove(key) {
      const request = this.objectStore().delete(key);
      request.onerror = e => {
        console.log(`error in remove key:${key}`, e);
      };
    },
    /**
     * 关闭数据库连接
     */
    close() {
      this.db && this.db.close();
      console.log('indexedDB closed');
    },
    getImage(key) {
      this.getValue(key, res => {
        var URL = window.URL || window.webkitURL;
        // Create and revoke ObjectURL
        var imgURL = URL.createObjectURL(res.blob);
        // Set img src to ObjectURL
        var imgDOM = document.getElementById('elephant');
        imgDOM.setAttribute('src', imgURL);
        imgDOM.onload = function() {
          //图片资源加载后释放对象
          URL.revokeObjectURL(imgURL);
        };
      });
    }
  };
  var imgs = [
    'https://img1.mukewang.com/szimg/59b8a486000107fb05400300.jpg',
    'https://img1.mukewang.com/szimg/5c18d2d8000141c506000338.jpg',
    'https://img1.mukewang.com/szimg/5a7127370001a8fa05400300.jpg'
  ];
  const db1 = new ImageStorage([
    'https://img1.mukewang.com/szimg/59b8a486000107fb05400300.jpg',
    'https://img1.mukewang.com/szimg/5a7127370001a8fa05400300.jpg'
  ]);
  const db2 = new ImageStorage(['https://img1.mukewang.com/szimg/5c18d2d8000141c506000338.jpg']);
})();
