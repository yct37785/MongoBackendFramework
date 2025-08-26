import express from 'express';
import { asyncHandler } from '../Middleware/AsyncHandler';
import { con_auth_register, con_auth_login, con_auth_refresh, con_auth_logout } from '../Controller/AuthController';

const router = express.Router();

router.post('/register', asyncHandler(async (req, res) => {
  const resData = await con_auth_register(req);
  return res.status(201).json(resData);
}));

router.post('/login', asyncHandler(async (req, res) => {
  const resData = await con_auth_login(req);
  return res.status(200).json(resData);
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const resData = await con_auth_refresh(req);
  return res.status(200).json(resData);
}));

router.post('/logout', asyncHandler(async (req, res) => {
  const resData = await con_auth_logout(req);
  return res.status(200).json(resData);
}));

export default router;
