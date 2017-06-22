import { BaseComponent } from '../base/Base';
import FormioUtils from '../../utils';
import Formio from '../../formio';

export class FileComponent extends BaseComponent {
  constructor(component, options, data) {
    super(component, options, data);
    this.support = {
      filereader: typeof FileReader != 'undefined',
      dnd: 'draggable' in document.createElement('span'),
      formdata: !!window.FormData,
      progress: "upload" in new XMLHttpRequest
    };
  }

  getValue() {
    return this.data[this.component.key];
  }

  setValue(value) {
    return this.data[this.component.key] = value;
  }

  build() {
    // Set default to empty array.
    this.setValue([]);

    this.createElement();
    this.createLabel(this.element);
    this.errorContainer = this.element;
    this.createErrorElement();
    this.listContainer = this.buildList();
    this.element.appendChild(this.listContainer);
    this.buildUpload(this.element);
    this.addWarnings(this.element);
    this.buildUploadStatusList(this.element);
  }

  refreshList() {
    const newList = this.buildList();
    this.element.replaceChild(newList, this.listContainer);
    this.listContainer = newList;
  }

  buildList() {
    if (this.component.image) {
      return this.buildImageList();
    }
    else {
      return this.buildFileList();
    }
  }

  buildFileList() {
    console.log(this.data[this.component.key]);
    return this.ce('filelist', 'ul', {class: 'list-group list-group-striped'}, [
      this.ce('fileheader', 'li', {class: 'list-group-item list-group-header hidden-xs hidden-sm'},
        this.ce('fileheaderrow', 'div', {class: 'row'},
          [
            this.ce('deletecol', 'div', {class: 'col-md-1'}),
            this.ce('filecol', 'div', {class: 'col-md-9'},
              this.ce('bold', 'strong', {}, 'File Name')
            ),
            this.ce('sizecol', 'div', {class: 'col-md-2'},
              this.ce('bold', 'strong', {}, 'Size')
            )
          ]
        )
      ),
      this.data[this.component.key].map((fileInfo, index) => this.createFileListItem(fileInfo, index))
    ]);
  }

  createFileListItem(fileInfo, index) {
    return this.ce('fileinforow', 'li', {class: 'list-group-item'},
      this.ce('fileheaderrow', 'div', {class: 'row'},
        [
          this.ce('deletecol', 'div', {class: 'col-md-1'},
            this.ce('deleteSpan', 'span', {class: 'glyphicon glyphicon-remove'}, null, {
              click: event => {
                event.preventDefault();
                this.data[this.component.key].splice(index, 1);
                this.refreshList();
                this.triggerChange();

              }
            })
          ),
          this.ce('filecol', 'div', {class: 'col-md-9'}, 'File Name'),
          this.ce('sizecol', 'div', {class: 'col-md-2'}, this.fileSize(fileInfo.size))
        ]
      )
    )
  }

  buildImageList() {
    let list = this.ce('imagelist', 'div');
    list.innerHTML = 'Image List';
    return list;
  }

  buildUpload(container) {
    const element = this;
    let upload, input;
    let wrapper = this.ce('uploadwrapper', 'div', {},
      upload = this.ce('upload', 'div', {class: 'fileSelector'}, [
          this.ce('icon', 'i', {class: 'glyphicon glyphicon-cloud-upload'}),
          this.text(' Drop files to attach, or '),
          this.ce('browse', 'a', false, 'browse', {
            click: event => {
              event.preventDefault();
              // There is no direct way to trigger a file dialog. To work around this, create an input of type file and trigger
              // a click event on it.
              let input = this.ce('fileinput', 'input', {type: 'file'});
              // Trigger a click event on the input.
              if (typeof input.trigger === 'function') {
                input.trigger('click');
              }
              else {
                input.click();
              }
              input.addEventListener('change', () => {this.upload(input.files)});
            }
          })
        ],
        {
          dragover: function (event) {
            this.className = 'fileSelector fileDragOver';
            event.preventDefault();
          },
          dragleave: function (event) {
            this.className = 'fileSelector';
            event.preventDefault();
          },
          drop: function(event) {
            this.className = 'fileSelector';
            event.preventDefault();
            element.upload(event.dataTransfer.files);
            return false;
          }
        }
      )
    );
    this.uploadContainer = wrapper;
    container.appendChild(wrapper);
  }

  buildUploadStatusList(container) {
    let list = this.ce('uploadlist', 'div');
    this.uploadStatusList = list;
    container.appendChild(list);
  }

  addWarnings(container) {
    let hasWarnings = false;
    let warnings = this.ce('warnings', 'div', {class: 'alert alert-warning'});
    if (!this.component.storage) {
      hasWarnings = true;
      warnings.appendChild(this.ce('nostorage', 'p').appendChild(this.text('No storage has been set for this field. File uploads are disabled until storage is set up.')));
    }
    if (!this.support.dnd) {
      hasWarnings = true;
      warnings.appendChild(this.ce('nodnd', 'p').appendChild(this.text('FFile Drag/Drop is not supported for this browser.')));
    }
    if (!this.support.filereader) {
      hasWarnings = true;
      warnings.appendChild(this.ce('nofilereader', 'p').appendChild(this.text('File API & FileReader API not supported.')));
    }
    if (!this.support.formdata) {
      hasWarnings = true;
      warnings.appendChild(this.ce('noformdata', 'p').appendChild(this.text('XHR2\'s FormData is not supported.')));
    }
    if (!this.support.progress) {
      hasWarnings = true;
      warnings.appendChild(this.ce('noprogress', 'p').appendChild(this.text('XHR2\'s upload progress isn\'t supported.')));
    }
    if (hasWarnings) {
      container.appendChild(warnings);
    }
  }

  fileSize(a, b, c, d, e) {
    return (b = Math, c = b.log, d = 1024, e = c(a) / c(d) | 0, a / b.pow(d, e)).toFixed(2) + ' ' + (e ? 'kMGTPEZY'[--e] + 'B' : 'Bytes');
  };

  createUploadStatus(fileUpload) {
    let container;
    return container = this.ce('uploadstatus', 'div', {class: 'file' + (fileUpload.status === 'error' ? ' has-error' : '')}, [
      this.ce('filerow', 'div', {class: 'row'}, [
          this.ce('filecell', 'div', {class: 'fileName control-label col-sm-10'}, [
            fileUpload.name,
            this.ce('removefile', 'span', {class: 'glyphicon glyphicon-remove'}, undefined, {
              click: () => {this.uploadStatusList.removeChild(container)}
            })
          ]),
          this.ce('sizecell', 'div', {class: 'fileSize control-label col-sm-2 text-right'}, this.fileSize(fileUpload.size))
        ]),
      this.ce('statusrow', 'div', {class: 'row'}, [
        this.ce('progresscell', 'div', {class: 'col-sm-12'}, [
          (fileUpload.status === 'progress' ?
            this.ce('progresscell', 'div', {class: 'progress'},
              this.ce('progressbar', 'div', {
                class: 'progress-bar',
                role: 'progressbar',
                'aria-valuenow': fileUpload.progress,
                'ariah-valuemin': 0,
                'ariah-valuemax': 100,
                style: 'width:' + fileUpload.progress + '%'
              },
                this.ce('srprogress', 'span', {class: 'sr-only'}, fileUpload.progress + '% Complete')
              )
            ) :
            this.ce('messagecell', 'div', {class: 'bg-' + fileUpload.status}, fileUpload.message)
          )
        ])
      ])
    ]);
  }

  upload(files) {
    if (this.component.storage && files && files.length) {
      // files is not really an array and does not have a forEach method, so fake it.
      Array.prototype.forEach.call(files, file => {
        // Get a unique name for this file to keep file collisions from occurring.
        const fileName = FormioUtils.uniqueName(file.name);
        let fileUpload = {
          name: fileName,
          size: file.size,
          status: 'info',
          message: 'Starting upload'
        };
        const dir = this.interpolate(this.component.dir || '', {data: this.data, row: this.row});
        let formio = null;
        if (this.options.formio) {
          formio = this.options.formio;
        }
        else {
          fileUpload.status = 'error';
          fileUpload.message = 'File Upload URL not provided.';
        }

        let uploadStatus = this.createUploadStatus(fileUpload);
        this.uploadStatusList.appendChild(uploadStatus);

        if (formio) {
          formio.uploadFile(this.component.storage, file, fileName, dir, evt => {
            fileUpload.status = 'progress';
            fileUpload.progress = parseInt(100.0 * evt.loaded / evt.total);
            delete fileUpload.message;
            const originalStatus = uploadStatus;
            uploadStatus = this.createUploadStatus(fileUpload);
            this.uploadStatusList.replaceChild(uploadStatus, originalStatus);
          }, this.component.url)
          .then(fileInfo => {
            this.uploadStatusList.removeChild(uploadStatus);
            this.data[this.component.key].push(fileInfo);
            this.refreshList();
            this.triggerChange();
          })
          .catch(response => {
            fileUpload.status = 'error';
            fileUpload.message = response;
            delete fileUpload.progress;
            const originalStatus = uploadStatus;
            uploadStatus = this.createUploadStatus(fileUpload);
            this.uploadStatusList.replaceChild(uploadStatus, originalStatus);
          });
        }
      });
    }
  }
}