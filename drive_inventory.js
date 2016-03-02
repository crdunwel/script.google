var startTime= (new Date()).getTime();
MAX_RUNNING_TIME = 1000*60*4 // 4 minutes in milliseconds
FIRST_RUN = true;

var folderIDs = [
  ['id of the google drive directory', 'label for directory', '/path/to/directory']
];

SPREADSHEET_URL = ""

// cache access to spreadsheet and various sheets
var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
var sheets = {};
for (var i=0; i < folderIDs.length; i++) {
  sheets[folderIDs[i][1]] = ss.getSheetByName(folderIDs[i][1]);
}

// cache directories we've copied already
var cache_sheet = ss.getSheetByName('cache');
var cache_obj = {};
var cache_data = cache_sheet.getDataRange().getValues();
for (var j = 0; j < cache_data.length; j++) {
  cache_obj[cache_data[j][0]] = true;
}

// main execution
for (var i=0; i < folderIDs.length; i++) {
  var folderID = folderIDs[i][0];
  
  if (FIRST_RUN) {
    var sheet = sheets[folderIDs[i][1]];
    sheet.appendRow(["Directory", "File Name", "Date Created", "Date Last Updated", "URL", "Owner", "Type"]);
  }
  
  listFilesInFolder(folderID, folderIDs[i][1], folderIDs[i][2])
}

function listFilesInFolder(id, sheetname, directory) {
  // prevent ceasing execution mid folder by google
  if ((new Date()).getTime() - startTime > MAX_RUNNING_TIME) {
    return;
  }
  
  // get folder and check if it's in cache before adding rows
  var folder = DriveApp.getFolderById(id);
  if (!cache_obj.hasOwnProperty(id)) {
  
    // initialize variables
    var files = folder.getFiles();
    var sheet = sheets[sheetname];
    
    // Populate sheet with date in this directory 
    while (files.hasNext()) {
      var file = files.next();
      var data = [
        directory,
        file.getName(),
        file.getDateCreated(),
        file.getLastUpdated(),
        file.getUrl(),
        file.getOwner().getName(),
        file.getMimeType()
      ];
      
      sheet.appendRow(data);
    }
    
    // Add this directory to the cache of completed directories so do don't do this in proceeding executions
    cache_sheet.appendRow([id, sheetname, directory, 'complete']);
    cache_obj[id] = true;
  }
      
  // Recursively spider subfolders of this directory
  var subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    subfolder = subfolders.next();
    try {
      listFilesInFolder(subfolder.getId(), sheetname, directory + subfolder.getName() + '/');
    }
    catch(Exception) {
      continue;
    }
  }
};
