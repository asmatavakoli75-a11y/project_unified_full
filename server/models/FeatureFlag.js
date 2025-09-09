
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const FeatureFlag = sequelize.define('FeatureFlag', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING, unique: true },
  value: { type: DataTypes.STRING },
}, { timestamps: true });

export default FeatureFlag;
