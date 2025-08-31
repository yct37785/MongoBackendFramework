import express from 'express';
import { asyncHandler } from 'framework/middleware';
import { con_entry_create, con_entry_get, con_entry_update, con_entry_delete } from '../Controller/EntryController';

const router = express.Router();

router.post('/create', asyncHandler(async (req, res) => {
  const resData = await con_entry_create(req);
  return res.status(201).json(resData);
}));

router.post('/get', asyncHandler(async (req, res) => {
  const resData = await con_entry_get(req);
  return res.status(200).json(resData);
}));

router.post('/update', asyncHandler(async (req, res) => {
  const resData = await con_entry_update(req);
  return res.status(200).json(resData);
}));

router.post('/delete', asyncHandler(async (req, res) => {
  const resData = await con_entry_delete(req);
  return res.status(200).json(resData);
}));

export default router;
