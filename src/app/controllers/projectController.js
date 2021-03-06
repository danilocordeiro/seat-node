const express = require('express');
const authMiddleware = require('../middlewares/auth');

const Project = require('../models/project');
const Task = require('../models/task');

const router = express.Router(); 

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().populate(['user','tasks']);
    res.status(200).send({projects});
  } catch (err) {
    return res.status(400).send({error: 'Error to loading projects'});
  }
});

router.get('/:projectId', async(req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate(['user', 'tasks']);
    res.status(200).send({project});
  } catch (err) {
    return res.status(400).send({error: 'Error to loading project'});
  }
});

router.post('/',async (req, res) => {
  try {
    const { title, description, tasks } = req.body;

    const project = await Project.create({ title, description, user: req.userId });

    await Promise.all(tasks.map( async task => {
      const projectsTask = new Task({...task, project: project._id});
      
      await projectsTask.save();

      project.tasks.push(projectsTask);
      
    }));

    await project.save();

    res.status(201).send({project});
  } catch (err) {
    console.log('====================================');
    console.log(err);
    console.log('====================================');
    return res.status(400).send({error: 'Error creating new project'});
  }
});

router.put('/:projectId', async(req, res) => {
  try {
    const { title, description, tasks } = req.body;

    const project = await Project.findByIdAndUpdate( req.params.projectId, {
      title, description}, { new: true });

    project.tasks = [];

    await Task.remove({project: project._id});

    await Promise.all(tasks.map( async task => {
      const projectsTask = new Task({...task, project: project._id});
      
      await projectsTask.save();

      project.tasks.push(projectsTask);
      
    }));

    await project.save();

    res.status(201).send({project});
  } catch (err) {
    console.log('====================================');
    console.log(err);
    console.log('====================================');
    return res.status(400).send({error: 'Error updating project'});
  }
});

router.delete('/:projectId', async(req, res) => {
  try {
    const project = await Project.findByIdAndRemove(req.params.projectId);
    res.send();
  } catch (err) {
    return res.status(400).send({error: 'Error to deleting project'});
  }
});

module.exports = app => app.use('/projects', router);