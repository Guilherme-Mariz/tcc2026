// INDEX
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'view/index.html'));
  });
  
  // LOGIN
  app.get('/login',  (req, res) => {
    res.sendFile(path.join(__dirname, 'view/pages/login.html'));
  });
  
  // REGISTER
  app.get('/register',  (req, res) => {
    res.sendFile(path.join(__dirname, 'view/pages/register.html'));
  });
  
  // HOME
  app.get('/home', verificarAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'view/pages/home.html'));
  });
  
  // CONFIGURAÇÕES
  app.get('/configuracoes', verificarAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'view/pages/configuracoes.html'));
  });
  
  // ATIVIDADES
  app.get('/atividades', verificarAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'view/pages/atividades.html'));
  });
  
  // TEKO.IA
  app.get('/tekoia', verificarAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'view/pages/tekoia.html'));
  });
  
  // RESPONSAVEL
  app.get('/responsavel', verificarAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'view/pages/responsavel.html'));
  });
  
  
  // ROTA DE CADASTRO
  app.post("/register", userController.registerCompleto);
  // Quando alguém fizer POST em /register → chama a função register
  
  app.post('/login', loginLimiter, userController.login);