# Inventário

Esse sistema processa um inventário por meio das seguintes etapas:

##Receber dados e criar um inventário.

1. Receber um arquivo do tipo .json ou .csv junto com o nome da pessoa responsável;
2. Criar uma pasta dentro de `./public` nomeada da seguinte forma: inventario-timestamp-nomeresponsavel tudo em letras minúsculas e sem espaço;
3. Salvar o arquivo recebido com o nome `inventario.json`;
4. Criar uma lista com todos os cabeçalhos e salvar em um arquivo `cabecalhos.json`;
5. Criar uma lista com todas as salas não incluindo nomes duplicados e salvar em um arquivo `salas.json`;
6. Criar uma lista com todos os setores não incluindo nomes duplicados e salvar em um arquivo `setores.json`;

##Fazer o inventário

1. Cada arquivo enviado cria uma página de inventário;
2. Coletar o nome do(a) servidor(a) que está fazendo o inventário;
3. Coletar a sala onde está sendo feito o inventário;
4. Pesquisar um item pelo número do tombo;
5. Se o item não for encontrado pode ser cadastrado;
6. Se o item for encontrado deve ser confirmado o estado de conservação;
7. Se a sala for diferente do último inventário aparecerá um alerta.
8. Confirmar as informações e enviar o bem inventariado;

##Gerar relatórios

1. Gerar relatório da coleta que mostra os bens organizados por sala com um sinalizados se já foi inventariado.

O sistema permanece em desenvolvimento e novas funcionalidades ainda serão adicionadas.
