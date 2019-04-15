const express = require('express')
const bodyParser = require('body-parser')
const app = express()

const path = require('path')
const sqlite = require('sqlite')
const dbConnection = sqlite.open(path.resolve(__dirname, 'banco.sqlite'), { Promise })

const port = process.env.PORT || 3000


app.set('views', path.join(__dirname, 'views'))//para garantir que ele vai encontrar nossos views. __dirname, caminho para views

//não queremos deixar o html junto do js, queremos separar para ficar mais organizado
//então queremos utilizar o ejs como uma linguagem de template dentro do express, não quero renderizar telas dentro do js
//queremos terceirizar isso para um outro modulo
app.set('view engine', 'ejs')//então como view engine nossa app vai usar o ejs

//se não achar nenhuma rota, vai usar a pasta public
//para garantir que ele vai encontrar nossa public adiciona path.join
app.use(express.static(path.join(__dirname, 'public')))//ex http://localhost:3000/images/logo-roxo.png

//toda requisição que passar pelo meu express, vai passar pelo bodyParser
//ele entende os dados vindo do corpo da requisição, 
app.use(bodyParser.urlencoded({
    extended: true
}))

app.get('/', async (request, response) => {
    const db = await dbConnection
    const categoriasDb = await db.all('select * from categorias')
    const vagas = await db.all('select * from vagas')
    const categorias = categoriasDb.map(cat => {
        return {
            ...cat,//spread operator, espalhando os campos de categoria
            vagas: vagas.filter(vaga => vaga.categoria === cat.id)//quero a vaga que categoria for igual a cat id
        }
    })
    //return response.send('<h1>Olá Fullstack lab</h1>')
    response.render('home', {//invés de response usaremos o render
        categorias
    })
})


app.get('/vaga/:id', async (request, response) => {
    const id = request.params.id
    const db = await dbConnection
    const vaga = await db.get(`select * from vagas where id=${id}`)
    //return response.send('<h1>Olá Fullstack lab</h1>')
    response.render('vaga', {//invés de response usaremos o render
        vaga
    })
})


/**
 * Pagina inicial - admin
 */

app.get('/admin', (req, res) => {
    res.render('admin/home')
})




/**
 * Categoria
 */
app.get('/admin/categorias', async (req, res) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    res.render('admin/categoria/categorias', {
        categorias
    })
})

app.get('/admin/categorias/nova', (req, res) => {
    res.render('admin/categoria/nova-categoria')
})

app.post('/admin/categorias/nova', async (req, res) => {
    const db = await dbConnection
    const { categoria } = req.body
    await db.run(`insert into categorias(categoria) values('${categoria}')`)
    res.redirect('/admin/categorias')
})


app.get('/admin/categorias/editar/:id', async(req,res)=>{
    const db = await dbConnection
    const id=req.params.id
    const categoria=await db.get('select * from categorias where id='+id)
    res.render('admin/categoria/editar-categoria',{
        categoria
    })
})
app.post('/admin/categorias/editar/:id', async (req, res) => {
    const db = await dbConnection
    const id=req.params.id
    const { categoria } = req.body
    await db.run(`update categorias set categoria = '${categoria}' where id = ${id}`)
    res.redirect('/admin/categorias')
})

app.get('/admin/categorias/delete/:id', async(req,res)=>{
    const db = await dbConnection
    const id=req.params.id
    await db.run('delete from categorias where id =' + id)
    res.redirect('/admin/categorias')
})


/**
 * Vagas
 */
app.get('/admin/vagas', async (req, res) => {
    const db = await dbConnection
    const vagas = await db.all('select * from vagas')
    res.render('admin/vaga/vagas', {
        vagas
    })
})

app.get('/admin/vagas/delete/:id', async (req, res) => {
    const id = req.params.id
    const db = await dbConnection
    await db.run('delete from vagas where id =' + id)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/nova', async (req, res) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    res.render('admin/vaga/nova-vaga', {
        categorias
    })
})

app.post('/admin/vagas/nova', async (req, res) => {
    const { titulo, descricao, categoria } = req.body
    const db = await dbConnection
    await db.run(`insert into vagas(categoria, titulo, descricao) values(${categoria},'${titulo}','${descricao}')`)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/editar/:id', async (req, res) => {
    const db = await dbConnection
    const id = req.params.id
    const vaga = await db.get(`select * from vagas where id=${id}`)
    const categorias = await db.all('select * from categorias')
    res.render('admin/vaga/editar-vaga', {
        vaga,
        categorias
    })
})
app.post('/admin/vagas/editar/:id', async (req, res) => {
    const { titulo, descricao, categoria } = req.body
    const db = await dbConnection
    const id = req.params.id
    await db.run(`update vagas set categoria = ${categoria}, titulo = '${titulo}', descricao = '${descricao}' where id = ${id}`)
    res.redirect('/admin/vagas')
})






const init = async () => {
    const db = await dbConnection
    await db.run('create table if not exists categorias (id INTEGER PRIMARY KEY, categoria TEXT)')
    await db.run('create table if not exists vagas (id INTEGER PRIMARY KEY, categoria INTEGER,titulo TEXT, descricao TEXT)')
    //const categoria= 'Marketing'
    //await db.run(`insert into categorias(categoria) values('${categoria}')`)

    //const vaga='Fullstack developer'
    //const descricao='Vaga para fullstack developer que fez o Fullstack Lab'
    //await db.run(`insert into vagas(categoria, titulo, descricao) values(1,'${vaga}','${descricao}')`)
}
init()

app.listen(port, (erro) => {
    if (erro) {
        console.log('Não foi possivel iniciar o servidor!')
    } else {
        console.log('Servidor rodando.')
    }
})