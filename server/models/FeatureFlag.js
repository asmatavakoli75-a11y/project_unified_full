const createFeatureFlagModel = (sequelize, DataTypes) => {
  const FeatureFlag = sequelize.define('FeatureFlag', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING, unique: true },
    value: { type: DataTypes.STRING },
  }, { timestamps: true });

  return FeatureFlag;
};

export default createFeatureFlagModel;
