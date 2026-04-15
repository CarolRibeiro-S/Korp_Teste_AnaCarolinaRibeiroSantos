package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

var pool *pgxpool.Pool

type Produto struct {
	ID        int    `json:"id"`
	Codigo    string `json:"codigo"`
	Descricao string `json:"descricao"`
	Saldo     int    `json:"saldo"`
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
		CREATE TABLE IF NOT EXISTS produtos (
			id SERIAL PRIMARY KEY,
			codigo VARCHAR(50) UNIQUE NOT NULL,
			descricao VARCHAR(200) NOT NULL,
			saldo INTEGER NOT NULL DEFAULT 0
		)
	`)
	if err != nil {
		log.Fatal("Erro ao criar tabela:", err)
	}
	log.Println("Banco de dados conectado!")
}

func main() {
	conectarBanco()
	r := gin.Default()
	r.Use(cors.Default())
	r.GET("/produtos", listarProdutos)
	r.POST("/produtos", criarProduto)
	r.PUT("/produtos/:id", atualizarProduto)
	r.DELETE("/produtos/:id", deletarProduto)
	r.PUT("/produtos/:id/saldo", atualizarSaldo)
	log.Println("Servico de Estoque rodando na porta 8081")
	r.Run(":8081")
}

func listarProdutos(c *gin.Context) {
	rows, err := pool.Query(context.Background(), "SELECT id, codigo, descricao, saldo FROM produtos")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}
	defer rows.Close()
	var produtos []Produto
	for rows.Next() {
		var p Produto
		rows.Scan(&p.ID, &p.Codigo, &p.Descricao, &p.Saldo)
		produtos = append(produtos, p)
	}
	if produtos == nil {
		produtos = []Produto{}
	}
	c.JSON(http.StatusOK, produtos)
}

func criarProduto(c *gin.Context) {
	var p Produto
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}
	err := pool.QueryRow(context.Background(),
		"INSERT INTO produtos (codigo, descricao, saldo) VALUES ($1, $2, $3) RETURNING id",
		p.Codigo, p.Descricao, p.Saldo).Scan(&p.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, p)
}

func atualizarProduto(c *gin.Context) {
	id := c.Param("id")
	var p Produto
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}
	_, err := pool.Exec(context.Background(),
		"UPDATE produtos SET codigo=$1, descricao=$2, saldo=$3 WHERE id=$4",
		p.Codigo, p.Descricao, p.Saldo, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

func deletarProduto(c *gin.Context) {
	id := c.Param("id")
	_, err := pool.Exec(context.Background(), "DELETE FROM produtos WHERE id=$1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"mensagem": "Produto deletado"})
}

func atualizarSaldo(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Quantidade int `json:"quantidade"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}
	var saldoAtual int
	err := pool.QueryRow(context.Background(), "SELECT saldo FROM produtos WHERE id=$1", id).Scan(&saldoAtual)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erro": "Produto nao encontrado"})
		return
	}
	if saldoAtual < body.Quantidade {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "Saldo insuficiente"})
		return
	}
	novoSaldo := saldoAtual - body.Quantidade
	pool.Exec(context.Background(), "UPDATE produtos SET saldo=$1 WHERE id=$2", novoSaldo, id)
	c.JSON(http.StatusOK, gin.H{"id": id, "saldo": novoSaldo})
}