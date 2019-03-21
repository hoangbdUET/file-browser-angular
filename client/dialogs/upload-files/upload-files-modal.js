const async = require('../../vendor/js/async.min');
const helper = require('../dialog-helper');
require('./upload-files-modal');

module.exports = function (ModalService, Upload, fileExplorerCtrl, callback) {
  modalController.$inject = ['$scope', 'close'];

  function modalController($scope, close) {
    let self = this;

    this.uploadFileList = [];
    self.selectedFile = null;
    self.processing = false;
    this.addForUpload = function ($files) {
      self.selectedFile = $files[0];
      self.uploadFileList = _.union(self.uploadFileList, $files);
      async.each(self.uploadFileList, (file, next) => {
        let currentTime = Date.now() + '';
        file.uploadingProgress = null;
        file.overwrite = false;
        file.existed = false;
        file.metaData = [
          {name: "name", value: file.name},
          {name: "type", value: (file.type || file.type !== '') ? file.type : 'Unknown'},
          {name: "size", value: file.size},
          {
            name: "location",
            value: (fileExplorerCtrl.rootFolder + fileExplorerCtrl.currentPath.join('/') + '/' + file.name).replace('//', '/')
          },
          {name: "author", value: window.localStorage.getItem('username')},
          {name: "uploaded", value: currentTime},
          {name: "modified", value: file.lastModified},
          {name: "source", value: "Desktop Uploaded"},
          {name: "field", value: ""}, //from selected well box
          {name: "well", value: ""}, // wells in project
          {name: "welltype", value: ""}, // from selected well box
          {name: "parameter", value: ""}, //select parameter task from list params set
          {name: "datatype", value: "Other"}, //single select box
          {name: "quality", value: 5}, //1-5
          {name: "relatesto", value: ""},
          {name: "description", value: ""},
        ];
        next();
      });
    };

    this.removeFromUpload = function (index) {
      if (self.uploadFileList[index].uploadingObject) self.uploadFileList[index].uploadingObject.abort();
      self.uploadFileList.splice(index, 1);
      self.selectedFile = null;
      if (self.uploadFileList.length === 0) self.processing = false;
      // !$scope.$$phase && $scope.$digest();
    };

    this.uploadFiles = function (index) {
      if (_.isFinite(index)) {
        self.uploadFileList[index].overwrite = true;
      }
      // fileExplorerCtrl.requesting = !fileExplorerCtrl.requesting;
      self.processing = true;
      self.selectedFile = null;
      async.each(self.uploadFileList, (file, next) => {
          if (file.uploadingProgress || (file.existed && !file.overwrite)) {
            next();
          } else {
            let metaDataRequest = {};
            file.metaData.forEach(m => {
              metaDataRequest[m.name.replace(/\s/g, '')] = m.value + ''
            });
            self.uploadUrl = fileExplorerCtrl.uploadUrl + encodeURIComponent(fileExplorerCtrl.rootFolder + fileExplorerCtrl.currentPath.join('/')) + '&metaData=' + encodeURIComponent(JSON.stringify(metaDataRequest)) + '&overwrite=' + file.overwrite;
            file.uploadingObject = Upload.upload({
              url: self.uploadUrl,
              headers: {
                'Content-Type': 'application/json',
                'Referrer-Policy': 'no-referrer',
                'Authorization': window.localStorage.getItem('token'),
                'Storage-Database': JSON.stringify(fileExplorerCtrl.storageDatabase)
              },
              data: {
                'upload-file': file
              }
            });
            file.uploadingObject.then(resp => {
              self.uploadFileList.splice(self.uploadFileList.findIndex(f => _.isEqual(f, file)), 1);
              console.log(resp);
              next();
            }, err => {
              console.log('Error status: ' + err);
              if (err.status === 409) {
                let index = self.uploadFileList.findIndex(f => _.isEqual(f, file));
                self.uploadFileList[index].existed = true;
                self.uploadFileList[index].uploadingProgress = null;
                self.uploadFileList[index].overwrite = false;
                next();
              }
            }, event => {
              let percentage = event.loaded / event.total * 100;
              if (event.type === "load") {
                file.uploadingProgress.status = "Uploaded ...";
              }
              file.uploadingProgress = {
                progress: percentage,
                status: "Uploading ..."
              };
              !$scope.$$phase && $scope.$digest();
            });
            file.uploadingObject.catch(err => {
              console.log("Upload terminated", err.message);
            });
          }
        }, err => {
          if (!err && self.uploadFileList.length === 0) {
            // fileExplorerCtrl.requesting = !fileExplorerCtrl.requesting;
            console.log('===upload files done');
            fileExplorerCtrl.goTo(fileExplorerCtrl.currentPath.length - 1);
            close();
          }
        }
      )
    }
    ;

    self.addMetadata = function (selectedFile) {
      selectedFile.metaData.push({
        name: ("field " + (selectedFile.metaData.length + 1)).replace(/\s/g, ''),
        value: ("value " + (selectedFile.metaData.length + 1))
      });
    };

    self.removeMetadata = function (m) {
      _.remove(self.selectedFile.metaData, el => {
        return el.name === m.name;
      })
    };

    self.selectFile = function (uploadFile) {
      self.selectedFile = uploadFile;
      console.log("Doi ne ", self.selectedFile);
    };

    this.closeModal = function () {
      close(null);
    }
  }

  ModalService.showModal({
    template: require('./upload-files-modal.html'),
    controller: modalController,
    controllerAs: 'self'
  }).then((modal) => {
    helper.initModal(modal);
    modal.close.then(data => {
      helper.removeBackdrop();
      if (callback)
        callback(data);
    })
  })
}
;