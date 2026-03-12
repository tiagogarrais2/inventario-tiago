# Implantação de aplicação no cluster Docker do IFCE

## Fluxo de implantação

### 1. Solicite à DGTI a criação do repositório para o seu projeto

A solicitação deve conter:
- Nome do projeto
- Nome e porta do serviço que será exposto para o proxy reverso (ex.: app:8000, ou frontend:80)
- Tipo de banco de dados usado (postgres ou mariadb), se necessário
- Nome dos volumes persistentes utilizados (ex.: uploads, arquivos)

A DGTI criará:

- Um projeto no Gitlab com para a sua aplicação, para versionar seus arquivos de implantação (compose, variáveis de ambiente e configurações)
- Uma entrada no HAproxy apontando para o container web da sua aplicação (ex.: exemplo_app:8000)
- O banco de dados (postgres ou mariadb), se necessário
- Uma Secret (https://docs.docker.com/engine/swarm/secrets/) com a senha do banco de dados no padrão pg_exemplo_pass ou mysql_exemplo_pass (onde "exemplo" é o nome do seu projeto), se necessário
- Um diretório no servidor NFS para armazenar os arquivos persistentes dos volumes, se necessário

> [!important]
> O código fonte da sua aplicação **não** será hospedado neste repositório, apenas os arquivos de implantação.

### 2. Crie seu projeto com base no projeto de exemplo

Clone o projeto criado pela DGTI (utilize o link de clone via SSH) e utilize o projeto de exemplo (dgti/projetos/exemplo>) para criar o compose de implantação da sua aplicação.

Seu projeto deverá seguir o compose de refererência, bem com as nomenclaturas adotadas (compose.hml.yaml e compose.prd.yaml).

### 3. Cadastre sua chave SSH no Gitlab em (https://gitlab.ifce.edu.br/-/user_settings/ssh_keys)

Instruções para gerar uma chave SSH: https://docs.gitlab.com/17.11/user/ssh/

### 4. Envie sua imagem docker para o Gitlab Registry

Gere sua imagem localmente e envie para o Gitlab Registry do IFCE. Para isso, primeiro faça o login no Gitlab Registry:

```bash
docker login gitlab.ifce.edu.br:5050
```

Depois tagueie sua imagem para preparar o envio para o Gitlab Registry:

```bash
docker tag exemplo gitlab.ifce.edu.br:5050/projetos/exemplo:1.0.0
```

Por fim, envie para o Gitlab Registry:

```bash
docker push gitlab.ifce.edu.br:5050/projetos/exemplo:1.0.0
```

### 5. Envie seus códigos de implantação para o repositório

Faça um `commit` e um `git push` para enviar seu projeto local para o repositório remoto.

Os commits enviados para a branch main dispararão a pipeline que validará seus arquivos de implantação e, caso esteja tudo em conformidade com os padrões, fará o deploy no cluster.

Você pode verificar o status de execução da pipeline em Jobs::Pipeline.

Caso a pipeline falhe em alguma validação, você verá o erro indicado na saída do job.

> [!tip]
> Caso queira publicar sua aplicação inicialmente no cluster de homologação, utilize uma branch com nome "homologacao" e um compose com o nome `compose.hml.yaml`.

## Fluxo de atualização

### 1. Após concluir seus testes de desenvolvimento localmente envie a nova versão da imagem docker para o Gitlab Registry.

Gere sua imagem atualizada localmente e envie para o Gitlab Registry do IFCE. Para isso, primeiro faça o login no Gitlab Registry:

```bash
docker login gitlab.ifce.edu.br:5050
```

Depois tagueie sua imagem para preparar o envio para o Gitlab Registry:

```bash
docker tag exemplo gitlab.ifce.edu.br:5050/projetos/exemplo:1.1.0
```

Por fim, envie para o Gitlab Registry:

```bash
docker push gitlab.ifce.edu.br:5050/projetos/exemplo:1.1.0
```

### 2. Atualize o compose para utilizar a nova versão da sua imagem

Altere em seu compose imagem do serviço para apontar para a nova versão.

Exemplo:

```yaml
services:
  app:
    image: gitlab.ifce.edu.br:5050/projetos/exemplo:1.1.0
```

Faça um `commit` e `git push` para enviar seu projeto local para o repositório remoto.

Os commits enviados para a branch `main` dispararão a pipeline que validará seus arquivos de implantação e, caso esteja tudo em conformidade com os padrões, fará o deploy no cluster de produção.

Você pode verificar o status de execução da pipeline em Jobs::Pipeline.

Caso a pipeline falhe em alguma validação, você verá o erro indicado na saída do job.