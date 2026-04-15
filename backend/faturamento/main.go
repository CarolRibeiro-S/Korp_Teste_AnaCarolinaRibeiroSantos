package main

 import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

var pool *pgxpool.Pool

type NotaFiscal struct {
	ID       int       `json:"id"`
	Numero   int       `json:"numero"`
	Status   string    `json:"status"`
	CriadoEm time.Time `json:"criado_em"`
}

type ItemNota struct {
	ID         int `json:"id"`
	NotaID     int `json:"nota_id"`
	ProdutoID  int `json:"produto_id"`
	Quantidade int `json:"quantidade"`
}

func getDatabaseURL() string {
	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		return dbURL
	}

	dbUser := os.Getenv("POSTGRES_USER")
	if dbUser == "" {
		dbUser = "postgres"
	}
	dbPassword := os.Getenv("POSTGRES_PASSWORD")
	if dbPassword == "" {
		dbPassword = "postgres"
	}
	dbHost := os.Getenv("POSTGRES_HOST")
	if dbHost == "" {
		dbHost = "127.0.0.1"
	}
	dbPort := os.Getenv("POSTGRES_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}
	dbName := os.Getenv("POSTGRES_DB")
	if dbName == "" {
		dbName = "korp"
	}

	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		dbUser, dbPassword, dbHost, dbPort, dbName)
}

func conectarBanco() {
	var err error
	pool, err = pgxpool.New(context.Background(), getDatabaseURL())
	if err != nil {
		log.Fatal("Erro ao conectar no banco:", err)
	}

	_, err = pool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS notas_fiscais (
			id SERIAL PRIMARY KEY,
			numero SERIAL UNIQUE,
			status VARCHAR(20) NOT NULL DEFAULT 'Aberta',
			criado_em TIMESTAMP DEFAULT NOW()
		);
		CREATE TABLE IF NOT EXISTS itens_nota (
			id SERIAL PRIMARY KEY,
			nota_id INTEGER REFERENCES notas_fiscais(id),
			produto_id INTEGER NOT NULL,
			quantidade INTEGER NOT NULL
		);
	`)
	if err != nil {
		log.Fatal("Erro ao criar tabelas:", err)
	}
	log.Println("Banco de dados conectado!")
}

func main() {
	conectarBanco()

	r := gin.Default()
	r.Use(cors.Default())

	r.GET("/notas", listarNotas)
	r.POST("/notas", criarNota)
	r.GET("/notas/:id", buscarNota)
	r.POST("/notas/:id/imprimir", imprimirNota)

	log.Println("Servico de Faturamento rodando na porta 8082")
	r.Run(":8082")
}

func listarNotas(c *gin.Context) {
	rows, err := pool.Query(context.Background(), "SELECT id, numero, status, criado_em FROM notas_fiscais ORDER BY numero DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}
	defer rows.Close()

	var notas []NotaFiscal
	for rows.Next() {
		var n NotaFiscal
		rows.Scan(&n.ID, &n.Numero, &n.Status, &n.CriadoEm)
		notas = append(notas, n)
	}
	if notas == nil {
		notas = []NotaFiscal{}
	}
	c.JSON(http.StatusOK, notas)
}

func criarNota(c *gin.Context) {
	var body struct {
		Itens []ItemNota `json:"itens"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}

	var nota NotaFiscal
	err := pool.QueryRow(context.Background(),
		"INSERT INTO notas_fiscais (status) VALUES ('Aberta') RETURNING id, numero, status, criado_em").
		Scan(&nota.ID, &nota.Numero, &nota.Status, &nota.CriadoEm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}

	for _, item := range body.Itens {
		pool.Exec(context.Background(),
			"INSERT INTO itens_nota (nota_id, produto_id, quantidade) VALUES ($1, $2, $3)",
			nota.ID, item.ProdutoID, item.Quantidade)
	}

	c.JSON(http.StatusCreated, nota)
}

func buscarNota(c *gin.Context) {
	id := c.Param("id")
	var nota NotaFiscal
	err := pool.QueryRow(context.Background(),
		"SELECT id, numero, status, criado_em FROM notas_fiscais WHERE id=$1", id).
		Scan(&nota.ID, &nota.Numero, &nota.Status, &nota.CriadoEm)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erro": "Nota nao encontrada"})
		return
	}

	rows, _ := pool.Query(context.Background(),
		"SELECT id, nota_id, produto_id, quantidade FROM itens_nota WHERE nota_id=$1", id)
	defer rows.Close()

	var itens []ItemNota
	for rows.Next() {
		var item ItemNota
		rows.Scan(&item.ID, &item.NotaID, &item.ProdutoID, &item.Quantidade)
		itens = append(itens, item)
	}
	if itens == nil {
		itens = []ItemNota{}
	}

	c.JSON(http.StatusOK, gin.H{"nota": nota, "itens": itens})
}

func imprimirNota(c *gin.Context) {
	id := c.Param("id")

	var status string
	err := pool.QueryRow(context.Background(),
		"SELECT status FROM notas_fiscais WHERE id=$1", id).Scan(&status)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erro": "Nota nao encontrada"})
		return
	}

	if status != "Aberta" {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "Apenas notas com status Aberta podem ser impressas"})
		return
	}

	rows, err := pool.Query(context.Background(),
		"SELECT produto_id, quantidade FROM itens_nota WHERE nota_id=$1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}
	defer rows.Close()

	type Item struct {
		ProdutoID  int
		Quantidade int
	}
	var itens []Item
	for rows.Next() {
		var item Item
		rows.Scan(&item.ProdutoID, &item.Quantidade)
		itens = append(itens, item)
	}

	client := &http.Client{}
	for _, item := range itens {
		body := strings.NewReader(fmt.Sprintf(`{"quantidade":%d}`, item.Quantidade))
		url := fmt.Sprintf("http://localhost:8081/produtos/%d/saldo", item.ProdutoID)
		req, _ := http.NewRequest("PUT", url, body)
		req.Header.Set("Content-Type", "application/json")
		resp, err := client.Do(req)
		if err != nil || resp.StatusCode != http.StatusOK {
			c.JSON(http.StatusInternalServerError, gin.H{"erro": "Falha ao atualizar estoque do produto"})
			return
		}
	}

	pool.Exec(context.Background(),
		"UPDATE notas_fiscais SET status='Fechada' WHERE id=$1", id)

	c.JSON(http.StatusOK, gin.H{"mensagem": "Nota impressa e fechada com sucesso"})
}