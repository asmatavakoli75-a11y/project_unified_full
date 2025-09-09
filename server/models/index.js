import { connectDB } from '../config/db.js';
import User from './User.js';
import Questionnaire from './Questionnaire.js';
import Question from './Question.js';
import Assessment from './Assessment.js';
import Note from './Note.js';
import Setting from './Setting.js';
import PredictionModel from './PredictionModel.js';
import FeatureFlag from './FeatureFlag.js';

const db = {};

const initializeDB = async () => {
  const sequelize = await connectDB();

  db.sequelize = sequelize;
  db.User = User(sequelize);
  db.Questionnaire = Questionnaire(sequelize);
  db.Question = Question(sequelize);
  db.Assessment = Assessment(sequelize);
  db.Note = Note(sequelize);
  db.Setting = Setting(sequelize);
  db.FeatureFlag = FeatureFlag(sequelize);
  db.PredictionModel = PredictionModel(sequelize);

  // Define associations here

  // User -> Assessment (One-to-Many)
  db.User.hasMany(db.Assessment, { foreignKey: 'patientId', as: 'assessments' });
  db.Assessment.belongsTo(db.User, { foreignKey: 'patientId', as: 'patient' });

  // Questionnaire -> Assessment (One-to-Many)
  db.Questionnaire.hasMany(db.Assessment, { foreignKey: 'questionnaireId', as: 'assessments' });
  db.Assessment.belongsTo(db.Questionnaire, { foreignKey: 'questionnaireId', as: 'questionnaire' });

  // User -> Note (One-to-Many, with two relations)
  db.Note.belongsTo(db.User, { as: 'patient', foreignKey: 'patientId' });
  db.Note.belongsTo(db.User, { as: 'author', foreignKey: 'authorId' });
  db.User.hasMany(db.Note, { as: 'notesAbout', foreignKey: 'patientId' });
  db.User.hasMany(db.Note, { as: 'authoredNotes', foreignKey: 'authorId' });

  // Questionnaire <-> Question (Many-to-Many)
  const QuestionnaireQuestion = sequelize.define('QuestionnaireQuestion', {}, { timestamps: false });
  db.Questionnaire.belongsToMany(db.Question, { through: QuestionnaireQuestion });
  db.Question.belongsToMany(db.Questionnaire, { through: QuestionnaireQuestion });

  return db;
};

export default initializeDB;
