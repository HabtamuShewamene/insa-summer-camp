import { body, param } from 'express-validator';
import { DocumentPermissionLevel } from '@prisma/client';

export const shareDocumentValidator = [
  param('id')
    .isUUID()
    .withMessage('Document ID must be a valid UUID'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must provide a valid email address'),
  
  body('permission')
    .isIn(['OWNER', 'EDITOR', 'COMMENTER', 'VIEWER'])
    .withMessage('Permission must be one of: OWNER, EDITOR, COMMENTER, VIEWER')
    .custom((value) => {
      if (value === 'OWNER') {
        throw new Error('Cannot assign OWNER permission via sharing');
      }
      return true;
    }),
];

export const getPermissionsValidator = [
  param('id')
    .isUUID()
    .withMessage('Document ID must be a valid UUID'),
];

export const updatePermissionValidator = [
  param('id')
    .isUUID()
    .withMessage('Document ID must be a valid UUID'),
  
  param('permissionId')
    .isUUID()
    .withMessage('Permission ID must be a valid UUID'),
  
  body('permission')
    .isIn(['OWNER', 'EDITOR', 'COMMENTER', 'VIEWER'])
    .withMessage('Permission must be one of: OWNER, EDITOR, COMMENTER, VIEWER')
    .custom((value) => {
      if (value === 'OWNER') {
        throw new Error('Cannot change permission to OWNER via this endpoint');
      }
      return true;
    }),
];

export const removePermissionValidator = [
  param('id')
    .isUUID()
    .withMessage('Document ID must be a valid UUID'),
  
  param('permissionId')
    .isUUID()
    .withMessage('Permission ID must be a valid UUID'),
];