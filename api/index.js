const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();
const mysql = require('mysql');
//const fileUpload = require('express-fileupload') al final no la use
//const jwt = require("jsonwebtoken") 
const multer = require("multer")
const mimeTypes = require("mime-types")
const nodemailer = require("nodemailer")



const { PORT } = require('./utils/constants');
//const PORT = process.env.PORT || 3001;

const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use(pino);
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods","PUT,GET,POST,PATCH")
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Headers','X-Requested-With,content-type,Origin,Accept,Authorization')
  next();
});


// Mysql
const connection = mysql.createConnection({
  host:'az1-ss43.a2hosting.com',
  user:'mariano1_adaclub',
  port: "3306",
  password:'mariano',
  database:'mariano1_adaclub'
});

/**
 * ENDPOINTS
 */
// route
app.get('/',(req,res) => {
  res.send('root de la API !');
});



// /spdb/"SAU_CARRERA (10,'tec')
/*==================================
   Exec SPs
  ==================================*/
  /* revisa rcon el toto
  app.get('/spget/:token',(req,res) => {
    const { token } = req.params;
    const id= jwt.verify(token,'clave')
    const sql = `call  ${id}`; 
  
    connection.query(sql,(error,result)=>{
  
        if (error) throw error;
        if (result.length > 0) {
            res.json(result)
        } else {
            res.send('Sin resultado')
        }
    })
  });
*/
app.get('/spget/:param',(req,res) => {
  const { param } = req.params;
  const sql = `call  ${param}`;

  connection.query(sql,(error,result)=>{

      if (error) throw error;
      if (result.length > 0) {
          res.json(result)
      } else {
          res.send('Sin resultado')
      }
  })
});



/*==================================
   Exec SPs con TOKEN
  ==================================*/
  // lo reem con u post
  /*
  app.get('/spgettokken/:param',(req,res) => {
    const { param } = req.params;
    const sql = `call  ${param}`;
  
    connection.query(sql,(error,result)=>{
        if (error) throw error;
        if (result.length > 0) {
          const token = jwt.sign({
            id_user: result[0].id, 
          }, 'clave');

          return res.send(token);
        } else {
          res.status(500).send({ error: 'Usuario o contrase単a incorrecto.' });
        }
    })
  });
  
*/

app.get('/ping', (req, res) => {
 res.send("pong")
});

app.get('/prueba', (req, res) => {
  connection.query('SELECT * FROM usu_apli_menues', (error, results) => {
    res.json(results)
  });
});

/*==================================
   Mostrar IMG de socios
  ==================================*/
app.get('/blobPreg/:soci_codi',(req,res) => {
  const { soci_codi } = req.params;
  const sql = `SELECT TO_BASE64(simg_imagen) AS simg_imagen FROM socios_imagen WHERE simg_soci_codi = ${soci_codi}`;
  connection.query(sql,(error,result)=>{
    if (error) throw error;
    if (result.length > 0) {
        res.json(result)
    } else {
        res.send('Sin resultado')
    }
  })
});

/*==================================
   Mostrar texto e IMG de ayuda
  ==================================*/
  /* no va mas ...lo puse en el js
  app.get('/blobAyuda/:ayud_clave',(req,res) => {
    const { ayud_clave } = req.params;
    const sql = `SELECT ayuda_titulo,
                        ayud_texto,
                        TO_BASE64(ayuda_imagen) AS ayuda_imagen
                  FROM ayuda
                  WHERE ayud_clave = '${ayud_clave}'`;
    connection.query(sql,(error,result)=>{
      if (error) throw error;
      if (result.length > 0) {
          res.json(result)
      } else {
          res.send('Sin resultado')
      }
    })
  });
  */

/*=========================================================
   Grabar IMG de socios ( Graba directamente a la tabla )
  ========================================================*/
app.post('/putFotSoc/', (req, res) => {
      const { alta_usua, soci_codi ,imagen } = req.body;
  const sqlsp = `call AM_SOCIOS_IMAGEN(?,?,?);`;

	connection.query(sqlsp,[alta_usua, soci_codi, imagen],(error,result)=>{
    if (error) throw error;
    if (result.length > 0) {
        res.json(result)
    } else {
        res.send('Sin resultado')
    }
  })
})


/*==================================
  subida de archivos
  ==================================*/
const storage = multer.diskStorage({
    destination: "public/",
    filename: function(req,file,cb) {
        cb("",file.originalname+"."+mimeTypes.extension(file.mimetype));

    }
})

const upload = multer({
    storage: storage
});

//app.get("/",(req,res)=>{
//    res.sendFile(__dirname + '/views/index.html');
//});

app.post("/files",upload.single('files'),(req,res) => {
    res.send('todo bien')
});

/*==================================
  Envio de mails
  ==================================*/
app.post('/sendMail/form/', (req, res) => {

  let transporter = nodemailer.createTransport({

      host: 'az1-ss43.a2hosting.com',
      port: 587,
      secure: false, // use SSL
      auth: {
        user: 'info@drets.admi.apli.com',
        pass: 'nostromo1sulaco2'
      }
    });
 
    const htmlEmail = `
      <h3>Email enviado por ${req.body.sistema}</h3>
      <ul>
        <li>Email : ${req.body.email}</li>
        <li>Asunto : ${req.body.asunto}</li>
      </ul>
      <p>${req.body.mensaje}</p>
      `;

    let mailOptions = {
      from : "adaclub@noReply.email", // quien manda el mail
      to : req.body.email, // Mail destino
      // replyTo : "javiermatarrodona@gmail.com",
      subject : req.body.asunto, // Asunto del mail
      text: req.body.mensaje,  // El mensaje
      html: htmlEmail // definida mas arriba
    };

    console.log(mailOptions);

    transporter.sendMail(mailOptions, function (error, info) {
      console.log("senMail returned!");
      if (error) {
        res.status(500).send(error.message)
        console.log("ERROR!!!!!!", error);
      } else {
        res.status(200).jsonp(req.body)
        console.log('Email sent: ' + info.response);
      }
    });

});

//check connect
connection.connect(error => {
  if (error) throw error;
  console.log('database server running!');
})

/**
 * LISTEN SERVER
 */
app.listen(PORT, () =>
  console.log('Express server is running on localhost:3001')
);

/**************************************************************************************
** Recordar en Mysql hacer esto para que funcione:                                   **
** a) ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'rush'  **
** b) flush privileges;                                                              **
** tambien correr para las funciones:                                                **
** SET GLOBAL log_bin_trust_function_creators = 1                                    **
***************************************************************************************/


/*  subir archivos al dir public
const appUp = express()

appUp.use(fileUpload());

appUp.post('/upload',(req,res) => {
	if (req.files===null) {
		return res.status(400).json({msg : 'No file uploaded'})
  }
    
	const file = req.files.file;
	file.mv(`${__dirname}/public/uploads/${file.mane}`, err => {
	  if(err) {
    	console.error(err);
	    return res.status(500).send(err)
	  }
	  res.json({ filename: file.name, filePath:`/uploads/${file.name}` })
  })

});

// listen port 
appUp.listen(5000, () =>
  console.log('Express server upload is running on localhost:5000')
);


npm init -yes  // crea el pk json
*/
