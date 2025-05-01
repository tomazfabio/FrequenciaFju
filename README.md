# Frequência FJU

Sistema de controle de frequência para a FJU (Força Jovem Universal) que permite registrar presenças em múltiplos eventos e gerar relatórios.

## Funcionalidades

- Login baseado em papéis com controle de acesso diferenciado
- Dashboard intuitivo com visão geral e acesso rápido
- Registro de presenças com suporte para colagem de listas de nomes
- Relatórios e estatísticas por evento, jovem e tribo
- Exportação de relatórios em formato texto
- Interface responsiva para uso em dispositivos móveis

## Como implantar

### Opção 1: Render

1. Crie uma conta no [Render](https://render.com/)
2. Clique em "New Web Service"
3. Conecte seu repositório GitHub ou faça upload do código
4. Configurações:
   - Build Command: (deixe em branco)
   - Start Command: `gunicorn main:app`
5. Adicione as seguintes variáveis de ambiente:
   - `SESSION_SECRET`: uma string aleatória para sessões seguras
   - Demais variáveis do Firebase se você ativar essa integração
6. Clique em "Create Web Service"

### Opção 2: Railway

1. Crie uma conta no [Railway](https://railway.app/)
2. Inicie um novo projeto
3. Escolha "Deploy from GitHub"
4. Conecte seu repositório
5. Railway detectará o Procfile automaticamente
6. Adicione as mesmas variáveis de ambiente listadas acima
7. Deploy!

### Opção 3: PythonAnywhere

1. Crie uma conta no [PythonAnywhere](https://www.pythonanywhere.com/)
2. Faça upload do código ou clone o repositório
3. Configure um novo aplicativo Web
4. Escolha Flask como framework
5. Configure o WSGI file para apontar para main:app
6. Configure as variáveis de ambiente
7. Reinicie o aplicativo

## Notas importantes

- Esta aplicação usa armazenamento em memória por padrão (os dados serão perdidos ao reiniciar)
- Para persistência de dados, configure um banco de dados externo
