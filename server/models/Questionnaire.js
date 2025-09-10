const createQuestionnaireModel = (sequelize, DataTypes) => {
  const Questionnaire = sequelize.define('Questionnaire', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true, // Assuming description can be optional
    },
  }, {
    timestamps: true, // This will add createdAt and updatedAt fields
  });

  return Questionnaire;
};

export default createQuestionnaireModel;
