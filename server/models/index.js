import { DataTypes } from 'sequelize';
import { getSequelize } from '../config/db.js';

// Import model definition functions
import createUserModel from './User.js';
import createQuestionnaireModel from './Questionnaire.js';
import createQuestionModel from './Question.js';
import createAssessmentModel from './Assessment.js';
import createNoteModel from './Note.js';
import createSettingModel from './Setting.js';
import createPredictionModel from './PredictionModel.js';
import createFeatureFlagModel from './FeatureFlag.js';

const db = {};
let initialized = false;

// This function will be called after sequelize is initialized
const initializeDB = () => {
  if (initialized) {
    return db;
  }

  const sequelize = getSequelize();

  // Initialize models
  db.User = createUserModel(sequelize, DataTypes);
  db.Questionnaire = createQuestionnaireModel(sequelize, DataTypes);
  db.Question = createQuestionModel(sequelize, DataTypes);
  db.Assessment = createAssessmentModel(sequelize, DataTypes);
  db.Note = createNoteModel(sequelize, DataTypes);
  db.Setting = createSettingModel(sequelize, DataTypes);
  db.FeatureFlag = createFeatureFlagModel(sequelize, DataTypes);
  db.PredictionModel = createPredictionModel(sequelize, DataTypes);

  // Define associations
  // User -> Assessment
  db.User.hasMany(db.Assessment, { foreignKey: 'patientId', as: 'assessments' });
  db.Assessment.belongsTo(db.User, { foreignKey: 'patientId', as: 'patient' });

  // Questionnaire -> Assessment
  db.Questionnaire.hasMany(db.Assessment, { foreignKey: 'questionnaireId', as: 'assessments' });
  db.Assessment.belongsTo(db.Questionnaire, { foreignKey: 'questionnaireId', as: 'questionnaire' });

  // User <-> Note
  db.Note.belongsTo(db.User, { as: 'patient', foreignKey: 'patientId' });
  db.Note.belongsTo(db.User, { as: 'author', foreignKey: 'authorId' });
  db.User.hasMany(db.Note, { as: 'notesAbout', foreignKey: 'patientId' });
  db.User.hasMany(db.Note, { as: 'authoredNotes', foreignKey: 'authorId' });

  // Questionnaire <-> Question
  const QuestionnaireQuestion = sequelize.define('QuestionnaireQuestion', {}, { timestamps: false });
  db.Questionnaire.belongsToMany(db.Question, { through: QuestionnaireQuestion });
  db.Question.belongsToMany(db.Questionnaire, { through: QuestionnaireQuestion });

  db.sequelize = sequelize;
  initialized = true;

  return db;
};

export default initializeDB;
