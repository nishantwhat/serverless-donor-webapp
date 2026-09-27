/**
 * Google Drive Utility Functions
 * 
 * Helpers for managing files and folders on Google Drive
 * Used for storing receipt PDFs and other generated files
 */

/**
 * Get or create the main Receipts folder
 * @returns {Folder} The Receipts folder
 */
function getReceiptsFolder() {
  const folderName = 'Ray of Hope - Receipts';
  let folder = findFolderByName(folderName);
  
  if (!folder) {
    // Create new folder in root
    folder = DriveApp.getRootFolder().createFolder(folderName);
    Logger.log(`Created folder: ${folderName}`);
  }
  
  return folder;
}

/**
 * Get or create a year subfolder for receipts
 * @param {number} year - Year (e.g., 2026)
 * @returns {Folder} The year folder
 */
function getYearFolder(year) {
  const parentFolder = getReceiptsFolder();
  const yearString = year.toString();
  
  let folder = findFolderInParent(parentFolder, yearString);
  
  if (!folder) {
    folder = parentFolder.createFolder(yearString);
    Logger.log(`Created year folder: ${yearString}`);
  }
  
  return folder;
}

/**
 * Find a folder by name in the entire Drive
 * @param {string} folderName - Name to search for
 * @returns {Folder|null} The folder or null if not found
 */
function findFolderByName(folderName) {
  const iterator = DriveApp.getFoldersByName(folderName);
  
  if (iterator.hasNext()) {
    return iterator.next();
  }
  
  return null;
}

/**
 * Find a folder by name within a specific parent folder
 * @param {Folder} parentFolder - Parent folder to search in
 * @param {string} folderName - Folder name to find
 * @returns {Folder|null} The folder or null if not found
 */
function findFolderInParent(parentFolder, folderName) {
  const iterator = parentFolder.getFoldersByName(folderName);
  
  if (iterator.hasNext()) {
    return iterator.next();
  }
  
  return null;
}

/**
 * Save a file to Drive
 * @param {string} fileName - Name of file
 * @param {Blob} fileBlob - File content as Blob
 * @param {Folder} folder - Folder to save in
 * @returns {File} The created file
 */
function saveFileToDrive(fileName, fileBlob, folder = null) {
  try {
    if (!folder) {
      folder = DriveApp.getRootFolder();
    }
    
    const file = folder.createFile(fileBlob.setName(fileName));
    Logger.log(`File saved: ${fileName}`);
    
    return file;
  } catch (error) {
    Logger.log(`Error saving file: ${error}`);
    throw error;
  }
}

/**
 * Save a receipt PDF
 * @param {string} fileName - Receipt file name
 * @param {Blob} pdfBlob - PDF content
 * @param {number} year - Year for folder organization
 * @returns {string} Shareable URL of the saved file
 */
function saveReceiptPDF(fileName, pdfBlob, year = null) {
  try {
    if (!year) {
      year = new Date().getFullYear();
    }
    
    const folder = getYearFolder(year);
    const file = saveFileToDrive(fileName, pdfBlob, folder);
    
    // Get shareable link
    file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
    const url = file.getUrl();
    
    Logger.log(`Receipt PDF saved: ${url}`);
    return url;
  } catch (error) {
    Logger.log(`Error saving receipt PDF: ${error}`);
    throw error;
  }
}

/**
 * Get a file from Drive by ID
 * @param {string} fileId - Google Drive file ID
 * @returns {File} The file
 */
function getFileById(fileId) {
  try {
    return DriveApp.getFileById(fileId);
  } catch (error) {
    Logger.log(`Error getting file: ${error}`);
    throw error;
  }
}

/**
 * Delete a file from Drive
 * @param {string} fileId - Google Drive file ID
 * @returns {boolean} True if successful
 */
function deleteFile(fileId) {
  try {
    const file = getFileById(fileId);
    file.setTrashed(true);
    return true;
  } catch (error) {
    Logger.log(`Error deleting file: ${error}`);
    return false;
  }
}

/**
 * Create a shareable link for a file
 * @param {string} fileId - Google Drive file ID
 * @returns {string} Shareable URL
 */
function getShareableLink(fileId) {
  try {
    const file = getFileById(fileId);
    file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (error) {
    Logger.log(`Error creating shareable link: ${error}`);
    throw error;
  }
}

/**
 * Get a file's download URL
 * @param {string} fileId - Google Drive file ID
 * @returns {string} Download URL
 */
function getDownloadUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Copy a file to a destination folder
 * @param {string} sourceFileId - Source file ID
 * @param {Folder} destinationFolder - Destination folder
 * @returns {File} The copied file
 */
function copyFile(sourceFileId, destinationFolder) {
  try {
    const sourceFile = getFileById(sourceFileId);
    const copiedFile = sourceFile.makeCopy(destinationFolder);
    return copiedFile;
  } catch (error) {
    Logger.log(`Error copying file: ${error}`);
    throw error;
  }
}