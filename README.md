# test-auto-resume

Projeto de teste para validar o comportamento de auto-resume do Claude Code. Contém utilitários TypeScript e uma API REST completa construída com NestJS.

---

## Estrutura do Projeto

```
test-auto-resume/
├── hello.ts                  # Função hello world
├── math.ts                   # Utilitários matemáticos
├── exemplo.ts                # Exemplo completo NestJS (service + controller + module)
├── produtos.controller.ts    # Controller HTTP de produtos (NestJS)
├── produtos.service.ts       # Lógica de negócio de produtos
├── produtos.module.ts        # Módulo NestJS com middlewares
├── auth.guard.ts             # Guards JWT, RBAC e interceptor de logging
├── produtos.spec.ts          # Testes unitários (Jest)
├── index.html                # Página HTML de demonstração
├── style.css                 # Estilos dark mode
├── guia.md                   # Guia NestJS avançado
└── tutorial-nestjs.md        # Tutorial NestJS avançado
```

---

## hello.ts

Função utilitária simples.

### `helloWorld(): string`

Retorna a string `'Hello World'`.

```typescript
import { helloWorld } from './hello';

helloWorld(); // 'Hello World'
```

---

## math.ts

Utilitários matemáticos com tipagem estrita e JSDoc completo.

### `round(valor: number, casas?: number): number`

Arredonda um número para N casas decimais (padrão: 2).

```typescript
import { round } from './math';

round(1.005, 2);     // 1.01
round(3.14159, 3);   // 3.142
round(2.5);          // 3  (padrão 0 casas não, padrão é 2)
```

### `clamp(valor: number, min: number, max: number): number`

Limita um número dentro do intervalo `[min, max]`.

```typescript
import { clamp } from './math';

clamp(150, 0, 100);  // 100  (acima do máximo)
clamp(-10, 0, 100);  // 0    (abaixo do mínimo)
clamp(50, 0, 100);   // 50   (dentro do intervalo)
// clamp(0, 10, 5) → lança RangeError (min > max)
```

### `isPrime(n: number): boolean`

Verifica se um número inteiro positivo é primo.

```typescript
import { isPrime } from './math';

isPrime(2);   // true
isPrime(17);  // true
isPrime(1);   // false
isPrime(4);   // false
isPrime(1.5); // false (não inteiro)
```

### `mean(valores: number[]): number`

Calcula a média aritmética. Lança `RangeError` se o array estiver vazio.

```typescript
import { mean } from './math';

mean([1, 2, 3, 4]);  // 2.5
mean([5]);           // 5
// mean([]) → lança RangeError
```

### `stddev(valores: number[]): number`

Calcula o desvio padrão amostral. Requer ao menos 2 valores.

```typescript
import { stddev } from './math';

stddev([2, 4, 4, 4, 5, 5, 7, 9]);  // 2
// stddev([5]) → lança RangeError
```

### `toRadians(graus: number): number`

Converte graus para radianos.

```typescript
import { toRadians } from './math';

toRadians(180);  // Math.PI  (~3.14159)
toRadians(90);   // Math.PI / 2
```

### `toDegrees(radianos: number): number`

Converte radianos para graus.

```typescript
import { toDegrees } from './math';

toDegrees(Math.PI);      // 180
toDegrees(Math.PI / 2);  // 90
```

---

## produtos.service.ts

Lógica de negócio completa para o recurso de produtos. Em produção, substitua os arrays por queries ao banco de dados.

### `listar(filtros: FiltrosProdutos): ListagemPaginada<Produto>`

Lista produtos ativos com suporte a filtros e paginação.

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `filtros.pagina` | `number` | sim | Número da página (começa em 1) |
| `filtros.limite` | `number` | sim | Itens por página |
| `filtros.categoria` | `string` | não | Filtra por categoria (case-insensitive) |
| `filtros.busca` | `string` | não | Busca no nome e descrição |
| `filtros.precoMin` | `number` | não | Preço mínimo (inclusive) |
| `filtros.precoMax` | `number` | não | Preço máximo (inclusive) |

```typescript
const service = new ProdutosService();

service.listar({ pagina: 1, limite: 10 });
// { data: [], total: 0, pagina: 1, limite: 10, totalPaginas: 0 }

service.listar({ pagina: 1, limite: 20, categoria: 'Eletrônicos', precoMax: 500 });
```

### `listarCategorias(): { data: string[] }`

Retorna todas as categorias únicas dos produtos ativos, ordenadas alfabeticamente.

```typescript
service.listarCategorias();
// { data: ['Eletrônicos', 'Informática', 'Moda'] }
```

### `buscarPorId(id: string): Produto`

Busca um produto ativo por ID. Lança `NotFoundException` se não encontrado.

```typescript
const produto = service.buscarPorId('uuid-do-produto');
// { id, nome, preco, estoque, categoria, ativo: true, ... }

service.buscarPorId('inexistente');
// → lança NotFoundException
```

### `criar(dto, usuarioId: string): Produto`

Cria um novo produto. Valida preço/estoque negativos e nome duplicado.

| Campo | Tipo | Descrição |
|---|---|---|
| `dto.nome` | `string` | Nome único do produto |
| `dto.descricao` | `string` | Descrição do produto |
| `dto.preco` | `number` | Preço (≥ 0) |
| `dto.estoque` | `number` | Estoque inicial (≥ 0) |
| `dto.categoria` | `string` | Categoria |

```typescript
const produto = service.criar({
  nome: 'Teclado Mecânico',
  descricao: 'Switch Cherry MX Red',
  preco: 299.90,
  estoque: 15,
  categoria: 'Informática',
}, 'usuario-uuid');

// → lança BadRequestException se preco ou estoque < 0
// → lança ConflictException se nome já existe
```

### `atualizar(id: string, dto: Partial<...>, usuarioId: string): Produto`

Atualiza campos de um produto. Apenas o criador pode editar.

```typescript
service.atualizar('produto-uuid', { preco: 349.90 }, 'usuario-uuid');
// → lança ForbiddenException se usuarioId !== criadoPor
// → lança NotFoundException se produto não existe
```

### `remover(id: string, usuarioId: string): void`

Soft delete — marca o produto como inativo. Apenas o criador pode remover.

```typescript
service.remover('produto-uuid', 'usuario-uuid');
// produto.ativo = false (não é deletado do banco)
```

### `ajustarEstoque(id: string, quantidade: number, motivo: string): MovimentacaoEstoque`

Ajusta o estoque (positivo = entrada, negativo = saída). Registra movimentação.

```typescript
service.ajustarEstoque('produto-uuid', 10, 'Reposição de estoque');
// { id, produtoId, quantidade: 10, estoqueAntes: 5, estoqueDepois: 15, motivo, criadoEm }

service.ajustarEstoque('produto-uuid', -20, 'Venda');
// → lança BadRequestException se estoqueDepois < 0
```

---

## produtos.controller.ts

Controller NestJS que expõe a API REST de produtos.

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/produtos` | não | Lista produtos com filtros e paginação |
| `GET` | `/produtos/categorias` | não | Lista categorias disponíveis |
| `GET` | `/produtos/:id` | não | Busca produto por UUID |
| `POST` | `/produtos` | JWT | Cria novo produto |
| `PUT` | `/produtos/:id` | JWT | Atualiza produto existente |
| `DELETE` | `/produtos/:id` | JWT | Remove produto (204) |
| `POST` | `/produtos/:id/estoque` | JWT | Ajusta estoque |

```bash
# Listar com filtros
GET /produtos?pagina=1&limite=10&categoria=Informática&precoMax=500

# Buscar por ID
GET /produtos/3f2504e0-4f89-11d3-9a0c-0305e82c3301

# Criar (requer Authorization: Bearer <token>)
POST /produtos
Content-Type: application/json
{ "nome": "Monitor 4K", "descricao": "IPS 27 polegadas", "preco": 1899, "estoque": 5, "categoria": "Informática" }

# Ajustar estoque
POST /produtos/:id/estoque
{ "quantidade": -2, "motivo": "Venda balcão" }
```

---

## auth.guard.ts

Guards de autenticação e autorização, decorators e interceptor de logging.

### `verificarJwt(token: string, secret: string): JwtPayload` *(interno)*

Decodifica e valida um JWT HS256. Verifica estrutura e expiração.

### `JwtGuard` — `canActivate(context): boolean`

Guard de autenticação JWT. Rotas com `@Publico()` são ignoradas.

```typescript
@Get('perfil')
@UseGuards(JwtGuard)
perfil(@UsuarioAtual() usuario: JwtPayload) {
  return usuario;
}

@Get('publico')
@Publico()
semAuth() { return 'acessível sem token'; }
```

### `RolesGuard` — `canActivate(context): boolean`

Guard RBAC. Usar após `JwtGuard`. Lê roles via `Reflector`.

```typescript
@Get('admin')
@Roles('admin', 'gestor')
@UseGuards(JwtGuard, RolesGuard)
painelAdmin() { ... }
```

### `AuthGuard` — `canActivate(context): boolean`

Combina `JwtGuard` + `RolesGuard` em um único guard.

```typescript
@Delete(':id')
@Roles('admin')
@UseGuards(AuthGuard)
remover(@Param('id') id: string) { ... }
```

### `LoggingInterceptor` — `intercept(context, next): Observable<any>`

Loga método, URL e tempo de resposta de cada requisição.

```typescript
// Aplicar globalmente:
app.useGlobalInterceptors(new LoggingInterceptor());

// Saída: GET /produtos — 12ms
```

### Decorators

| Decorator | Uso | Descrição |
|---|---|---|
| `@Publico()` | Classe ou método | Desativa autenticação na rota |
| `@Roles(...roles)` | Classe ou método | Define papéis exigidos |
| `@UsuarioAtual()` | Parâmetro | Injeta o `JwtPayload` do usuário autenticado |

---

## produtos.module.ts

Módulo NestJS que registra controller, service e aplica middlewares.

### `ProdutosModule.configure(consumer)` *(NestModule)*

Configura dois middlewares automaticamente:
- **`CorrelationIdMiddleware`**: adiciona `X-Correlation-ID` em todas as respostas
- **`RateLimitMiddleware`**: limita 100 requisições/min por IP nas rotas de escrita

```typescript
// Importar no AppModule:
@Module({ imports: [ProdutosModule] })
export class AppModule {}
```

### `criarAppModuleExemplo(): typeof AppModuleExemplo`

Função auxiliar que retorna um `AppModule` de exemplo para testes ou documentação.

---

## produtos.spec.ts

Testes unitários para `ProdutosService` usando Jest. **18 casos de teste** cobrindo todos os métodos.

```bash
npx jest produtos.spec.ts
```

| Suite | Casos | O que cobre |
|---|---|---|
| `listar()` | 5 | lista vazia, filtros por categoria/busca/preço, paginação |
| `buscarPorId()` | 3 | encontrado, não encontrado, produto removido |
| `criar()` | 4 | sucesso, preço negativo, estoque negativo, nome duplicado |
| `atualizar()` | 3 | campos atualizados, forbidden, not found |
| `ajustarEstoque()` | 3 | entrada, saída, estoque insuficiente |

---

## exemplo.ts

Exemplo completo e auto-contido de uma API NestJS: DTOs com `class-validator`, service, controller e módulo em um único arquivo. Útil como referência rápida.

---

## Frontend

### `index.html` + `style.css`

Página estática com tema dark (inspirado no GitHub Dark). Serve como landing page do projeto.

```bash
python3 -m http.server 8080
# Acesse http://localhost:8080
```

---

## Guias

| Arquivo | Conteúdo |
|---|---|
| `guia.md` | NestJS avançado: DI com tokens, módulos dinâmicos, RBAC, interceptors, event emitter, config validada |
| `tutorial-nestjs.md` | Tópicos avançados: injeção assíncrona, módulos dinâmicos, guards com roles, filters globais, health checks, produção |
