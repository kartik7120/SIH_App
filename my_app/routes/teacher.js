require('dotenv').config()
const teacher = require('../models/teacher')
const JWT = require('jsonwebtoken')
const express = require('express')
const bcrypt = require('bcryptjs')
const checkAdmin = require('../middlewares/checkAdmin')
const { check, validationResult, checkSchema } = require('express-validator')
const Email = require('../models/email')
const cloudinary = require('../cloudinary/index');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('teacher/index');
})
router.get('/login', (req, res) => {
    res.render('teacher/login')
})
router.get('/register', (req, res) => {
    res.render('teacher/register')
})

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const Teacher = await teacher.find({ email });

        if (!Teacher) {
            return res.status(400).json({ error: 'Email or password is not correct' });
        }

        const isValid = await bcrypt.compare(password, Teacher.password);

        if (!isValid) {
            return res.status(400).json({ error: 'Email or password is not correct' });
        }
        const token = JWT.sign({ email, msg: 'I am Admin Level 0' }, process.env.AUTH_SECRET, {
            expiresIn: '2 days'
        })
        res
            .cookie('teacher', token, { httpOnly: true, maxAge: 2 * 24 * 60 * 60 * 1000 })
            .redirect(200, '/index')
    }
    catch (error) {
        next(error);
    }
})


router.post('/register', [
    check("username", "Please enter the username for the user").notEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Please enter a password which is more than five characters').isLength({
        min: 6
    })
], async (req, res, next) => {
    const { username, password, email } = req.body;
    const errors = validatorResult(req);
    try {
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        const user = await teacher.find({ email });
        console.log(user)
        if (user && user.length !== 0) {
            return res.status(401).render('teacher/login', { error: 'User is already registered !' })
        }

        const hashedPassword = await bcrpyt.hash(password, 12);

        const newUser = new teacher({ name: username, password: hashedPassword, email, isAdmin: 0 })

        await newUser.save();

        const token = JWT.sign({ email, msg: 'I am admin level 0' }, process.env.AUTH_SECRET, {
            expiresIn: '2 days'
        })

        res.cookie('teacherCookie', token, {
            httpOnly: true,
            maxAge: 2 * 24 * 60 * 60 * 1000
        }).redirect('/teacher')
    } catch (error) {
        next(error);
    }
})

router.get('/logout', (req, res) => {
    const token = req.cookies('teacherToken');
    res.clearCookie('teacherCookie', { httpOnly: true, maxAge: 2 * 24 * 60 * 60 * 1000 })
    res.redirect('/index')
})

router.get('/email', (req, res) => {
    res.render('/teacher/email');
})

router.post('/email/create', checkAdmin, [
    check('subject', 'Please include a subject in the email').isLength({
        min: 1
    }),
    check('message', ' Please include a message in the email').isLength({
        min: 1
    })
], async (req, res, next) => {
    const { subject, message } = req.body;
    const error = validatorResult(req)

    if (!error) {
        return res.status(400).json({
            error: error.array()
        })
    }

    const email = new Email({
        from: 'teacher', subject, message
    })
    email.save();
    res.redirect('/index')
})

router.get('/transfer', (req, res) => {
    res.render('teacher/transfer')
})


router.get('/study', (req, res) => {
    res.render('/teacher/study')
})

router.get('/todo', (req, res) => {
    res.render('/todo')
})

router.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    const Teacher = await teacher.find({ _id: id });
    if (!teacher) {
        return res.status(400).redirect('/', { error: 'Teacher does not exist or is not registered.' })
    }
    res.json(teacher);
})

router.get('/edit/:id', checkAdmin, async (req, res, next) => {
    const { id } = req.params;

    const Teacher = await teacher.find({ teacher_id: id })

    if (!teacher) {
        return res.status(400).redirect('/index', { error: 'Teacher credentials entered does not exit' })
    }

    res.json(teacher);
})

router.get('/dailyUpdates', async (req, res, next) => {
    try {
        const updates = await DailyUpdates.find({});
        res.json({ updates });
    }
    catch (error) {
        next(error)
    }
})

module.exports = router;