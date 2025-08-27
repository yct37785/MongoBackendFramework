import { Request } from 'express';
import { PermissionError } from 'framework/error';
import { sanitizeObjectId } from 'framework/utils';
import { ser_createEntry, ser_fetchEntry, ser_updateEntry, ser_deleteEntry, ser_deleteUserAndData } from '../Services/EntryServices';
import { TITLE_MIN_LEN, TITLE_MAX_LEN, CONTENT_MIN_LEN, CONTENT_MAX_LEN } from '../Const';


