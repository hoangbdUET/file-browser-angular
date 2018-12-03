// Load css
require('./file-explorer.less');

// const crypto = require('crypto');
const textViewer = require('../text-viewer/text-viewer').name;
const pdfViewer = require('../pdf-viewer/pdf-viewer').name;
const textViewerDialog = require('../../dialogs/text-viewer/text-viewer-modal');
const pdfViewerDialog = require('../../dialogs/pdf-viewer/pdf-viewer-modal');
const imgPreview = require('../img-preview/img-preview').name

const moduleName = 'file-explorer';
const componentName = 'fileExplorer';

// let algorithm = 'aes-256-cbc';
// let password = 'myPass';

Controller.$inject = ['$scope', '$element', '$http', 'ModalService'];
function Controller($scope, $element, $http, ModalService) {
    let self = this;

    this.$onInit = function () {
        self.imgResource = {};
        self.currentPath = [];
        self.url = self.url || '/api/tree?path=';
        self.rawDataUrl = self.rawDataUrl || '/api/resource?path='
        self.rootFolder = self.rootFolder || 'public';

        self.httpGet(self.url + encodeURIComponent(self.rootFolder), result => {
            if (result) {
                let data = result.data.data;
                self.nodeSelected = [...data.files, ...data.folders];
            } else {
                console.log('No dir');
            }
        })
    }

    this.clickNode = function (item, $event) {
        // console.log(item);
    }

    this.dblClickNode = function (item) {
        if (!item.rootIsFile) {
            self.httpGet(self.url + encodeURIComponent(item.path), result => {
                let data = result.data.data;
                self.nodeSelected = [...data.files, ...data.folders];
                self.currentPath.push(item.rootName);
            })
        } else {
            self.httpGet(self.rawDataUrl + encodeURIComponent(item.path), result => {
                let data = { title: item.rootName };
                let resource = result.data.data;
                data.fileContent = resource;
                switch (true) {
                    case /\.pdf$/.test(self.getExtFile(item)):
                        data.fileContent = resource.base64;
                        pdfViewerDialog(ModalService, data);
                        break;
                    case /\.(jpg|png)$/.test(self.getExtFile(item)):
                        self.imgResource.title = item.rootName;
                        self.imgResource.fileContent = resource.base64;
                        let imgCtnElm = document.getElementById('img-container');
                        self.imgResource.parentElem = imgCtnElm;
                        imgCtnElm.style.display = 'block';
                        break;
                    default:
                        data.fileContent = resource.utf8;
                        textViewerDialog(ModalService, data);
                }
            })
        }
    }

    this.goTo = function (index) {
        self.currentPath = self.currentPath.slice(0, index + 1);
        let newPath = self.rootFolder + '/' + self.currentPath.join('/');
        self.httpGet(self.url + encodeURIComponent(newPath), result => {
            let data = result.data.data;
            self.nodeSelected = [...data.files, ...data.folders];
        })
    }

    this.getExtFile = function (item) {
        if (!item.rootIsFile)
            return '';
        let arr = item.rootName.split('.');
        return '.' + arr[arr.length - 1];
    }

    this.httpGet = function (url, cb) {
        let reqOptions = {
            method: 'GET',
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'Referrer-Policy': 'no-referrer',
                'Authorization': `hoangk'stoken`,
            }
        }
        $http(reqOptions).then(result => {
            cb(result);
        });
    }

    // function encrypt(text) {
    //     var cipher = crypto.createCipher(algorithm, password)
    //     var crypted = cipher.update(text, 'utf8', 'hex')
    //     crypted += cipher.final('hex');
    //     return crypted;
    // }
}

let app = angular.module(moduleName, [textViewer, pdfViewer, imgPreview]);

app.component(componentName, {
    template: require('./file-explorer.html'),
    controller: Controller,
    controllerAs: 'self',
    bindings: {
        rootFolder: '@',
        url: '@',
        rawDataUrl: '@'
    }
})

app.filter('strLimit', ['$filter', function ($filter) {
    return function (input, limit, more) {
        if (input.length <= limit) {
            return input;
        }
        return $filter('limitTo')(input, limit) + (more || '...');
    };
}]);

app.filter('fileExtension', ['$filter', function ($filter) {
    return function (input) {
        return /\./.test(input) && $filter('strLimit')(input.split('.').pop(), 3, '..') || '';
    };
}]);

module.exports.name = moduleName;

// // Load js
// require('../libs/jsTree-directive/jsTree.directive');
// require('../libs/jsTree/jstree.min');

// // Load css
// require('./file-explorer.less');
// require('../libs/jsTree/style.min.css');

// const moduleName = 'file-explorer';
// const componentName = 'fileExplorer';

// function Controller($scope, $element, $http, $timeout) {
//     let self = this;

//     this.$onInit = function () {
//         this.fileViewer = 'Please select a file to view its contents';
//     }

//     $scope.nodeSelected = this.nodeSelected || function (e, data) {
//         let node = data.node.li_attr;
//         if (node.isLeaf) {
//             $http.get('/api/resource?resource=' + encodeURIComponent(node.base)).then(function (result) {
//                 let fileContent = result.data;
//                 if (typeof fileContent == 'object') {
//                     fileContent = JSON.stringify(fileContent, undefined, 2);
//                 }
//                 self.fileViewer = fileContent;
//                 self.pdfData = atob(fileContent);
//                 loadingTask = pdfjsLib.getDocument({
//                     data: self.pdfData
//                 });

//                 loadingTask.promise.then((pdfDoc_) => {
//                     pdfDoc = pdfDoc_;
//                     document.getElementById('page_count').textContent = pdfDoc.numPages;

//                     renderPage(pageNum);
//                 })

//             })
//         } else {
//             self.fileViewer = 'Please select a file to view its contents';
//         }
//     }
//     let pdfjsLib = require('pdfjs-dist');
//     pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';


//     this.pdfData = atob(
//         'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwog' +
//         'IC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAv' +
//         'TWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0K' +
//         'Pj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAg' +
//         'L1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+' +
//         'PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9u' +
//         'dAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2Jq' +
//         'Cgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJU' +
//         'CjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVu' +
//         'ZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4g' +
//         'CjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAw' +
//         'MDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9v' +
//         'dCAxIDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9G');

//     let pdfDoc = null;
//     let pageNum = 1;
//     let pageRendering = false;
//     let pageNumPending = null;
//     let scale = 0.8;
//     let canvas = document.getElementById('pdfViewer');
//     let ctx = canvas.getContext('2d');

//     function renderPage(num) {
//         pageRendering = true;

//         pdfDoc.getPage(num).then((page) => {
//             let viewport = page.getViewport(scale);
//             canvas.height = viewport.height;
//             canvas.width = viewport.width;

//             let renderContext = {
//                 canvasContext: ctx,
//                 viewport: viewport
//             };

//             let renderTask = page.render(renderContext);

//             renderTask.promise.then(() => {
//                 pageRendering = false;
//                 if (pageNumPending !== null) {
//                     renderPage(pageNumPending);
//                     pageNumPending = null;
//                 }
//             })
//         })
//     }

//     function queueRenderPage(num) {
//         if (pageRendering) {
//             pageNumPending = num;
//         } else {
//             renderPage(num);
//         }
//     }

//     function onPrevPage() {
//         if (pageNum <= 1) {
//             return;
//         }
//         pageNum--;
//         document.getElementById('page_num').textContent = pageNum;
//         queueRenderPage(pageNum);
//     }
//     document.getElementById('prev').addEventListener('click', onPrevPage);

//     function onNextPage() {
//         if (pageNum >= pdfDoc.numPages) {
//             return;
//         }
//         pageNum++;
//         document.getElementById('page_num').textContent = pageNum;
//         queueRenderPage(pageNum);
//     }
//     document.getElementById('next').addEventListener('click', onNextPage);

//     let loadingTask = pdfjsLib.getDocument({
//         data: self.pdfData
//     });

//     loadingTask.promise.then((pdfDoc_) => {
//         pdfDoc = pdfDoc_;
//         document.getElementById('page_num').textContent = pageNum;
//         document.getElementById('page_count').textContent = pdfDoc.numPages;

//         renderPage(pageNum);
//     })
// }

// let app = angular.module(moduleName, ['jsTree.directive']);

// app.component(componentName, {
//     template: require('./file-explorer.html'),
//     controller: Controller,
//     controllerAs: 'self',
//     bindings: {
//         fileViewer: '<',
//         nodeSelected: '<'
//     }
// })

// module.exports.name = moduleName;