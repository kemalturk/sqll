import mysql from 'mysql2/promise'
import _ from 'lodash'
import moment from 'moment'

import { databaseConfig } from __dirname+'/config/database'


export default class Model {

  constructor() {
    this.table = this.getTableName()
  }

  getTableName() {
    throw Error("You should override the getTableName method")
  }

  async connect() {
    return await mysql.createConnection(databaseConfig)
  }

  /*
  ╔═╗ ╦ ╦╔═╗╦═╗╦ ╦
  ║═╬╗║ ║║╣ ╠╦╝╚╦╝
  ╚═╝╚╚═╝╚═╝╩╚═ ╩ 
  */

  async query(sql, values) {

    try {

      const conn = await this.connect()
      const result = await conn.execute(sql, values)
      await conn.end()
      return result

    } catch (err) {
      console.error(err)
      return false
    }

  }

  /*
  ╔═╗╦╔╗╔╔╦╗  ╔═╗╔╗╔╔═╗
  ╠╣ ║║║║ ║║  ║ ║║║║║╣ 
  ╚  ╩╝╚╝═╩╝  ╚═╝╝╚╝╚═╝
  */

  async findOne(where){

    if(!_.isPlainObject(where)) throw Error("parameter should be json object")

    //Gelen json objesini sql where statement a çeviriyoruz
    let setStatement = ""

    const length = _.size(where)

    let i = 0

    const values = []

    _.forEach(where, (value, key) => {
      setStatement += "`"+key+"`" + "=" + " ?"
      values.push(value)

      if(i < length - 1 )
        setStatement += " AND "

      i++
    })

    const sql = /*sql*/`Select * from ${this.table} where ${setStatement}`

    const r = await this.query(sql, values)

    if(!r) return false

    const [rows] = r

    if(!rows || rows.length !== 1) return false

    return rows[0]

  }

  /*
  ╔═╗╦╔╗╔╔╦╗  ╔═╗╦═╗  ╔═╗╦═╗╔═╗╔═╗╔╦╗╔═╗
  ╠╣ ║║║║ ║║  ║ ║╠╦╝  ║  ╠╦╝║╣ ╠═╣ ║ ║╣ 
  ╚  ╩╝╚╝═╩╝  ╚═╝╩╚═  ╚═╝╩╚═╚═╝╩ ╩ ╩ ╚═╝
  */

  async findOrCreate(data) {

    if(!_.isPlainObject(data)) throw Error("parameter should be json object")

    const existData = await this.findOne(data)
    if(existData) return existData

    const length = _.size(data)

    let i = 0

    let setStatement = ""

    const values = []

    _.forEach(data, (value, key) => {
      setStatement += "`"+key+"`" + "=" + "?"
      values.push(value)

      if(i < length - 1 )
        setStatement += ", "

      i++
    })

    const sql = /*sql*/`insert into ${this.table} set ${setStatement}`
    
    const r = await this.query(sql, values)

    if(!r) return false

    const [response] = r

    if(response.affectedRows !== 1)
      return false

    
    return await this.findOne({id: response.insertId})

  }

  /*
  ╦╔╗╔╔═╗╔═╗╦═╗╔╦╗  ╔═╗╦═╗  ╦ ╦╔═╗╔╦╗╔═╗╔╦╗╔═╗
  ║║║║╚═╗║╣ ╠╦╝ ║   ║ ║╠╦╝  ║ ║╠═╝ ║║╠═╣ ║ ║╣ 
  ╩╝╚╝╚═╝╚═╝╩╚═ ╩   ╚═╝╩╚═  ╚═╝╩  ═╩╝╩ ╩ ╩ ╚═╝
  */

  async insertOrUpdate(data, where) {

    if(!_.isPlainObject(data)) throw Error("data parameter should be json object")
    if(!_.isPlainObject(where)) throw Error("where parameter should be json object")

    let length = _.size(data)

    let i = 0

    let setStatement = ""

    let keysForQuery = ""
    let valuesForQuery = ""

    const values = []

    _.forEach(data, (value, key) => {
      // setStatement += "`"+key+"`" + " = " + "?"
      setStatement += "`"+key+"`" + " = " + "'"+value+"'"
      values.push(value)

      keysForQuery += "`"+key+"`"
      valuesForQuery += "'"+value+"'"

      if(i < length - 1 ){
        setStatement += ", "
        keysForQuery += ","
        valuesForQuery += ","
      }
        
      i++
    })


    const sql = /*sql*/`insert into ${this.table} (${keysForQuery}) values (${valuesForQuery}) on duplicate key update ${setStatement} `

    const r = await this.query(sql, values)

    if(!r) return false

    const [response] = r

    if(response.affectedRows < 1)
      return false

    return await this.findOne(where)

  }

  /*
  ╦╔╗╔╔═╗╔═╗╦═╗╔╦╗  ╔═╗╔╗╔╔═╗
  ║║║║╚═╗║╣ ╠╦╝ ║   ║ ║║║║║╣ 
  ╩╝╚╝╚═╝╚═╝╩╚═ ╩   ╚═╝╝╚╝╚═╝
  */

  async insertOne(data) {

    if(!_.isPlainObject(data)) throw Error("data parameter should be json object")

    let length = _.size(data)

    let i = 0

    let keysForQuery = ""
    let valuesForQuery = ""

    const values = []

    _.forEach(data, (value, key) => {

      values.push(value)

      keysForQuery += "`"+key+"`"
      valuesForQuery += "'"+value+"'"

      if(i < length - 1 ){
        keysForQuery += ","
        valuesForQuery += ","
      }
        
      i++
    })


    const sql = /*sql*/`insert into ${this.table} (${keysForQuery}) values (${valuesForQuery})`

    const r = await this.query(sql, values)

    if(!r) return false

    const [response] = r

    if(response.affectedRows < 1)
      return false

    return await this.findOne(data)


  }



  /*
  ██╗  ██╗███████╗██╗     ██████╗ ███████╗██████╗     ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
  ██║  ██║██╔════╝██║     ██╔══██╗██╔════╝██╔══██╗    ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
  ███████║█████╗  ██║     ██████╔╝█████╗  ██████╔╝    █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
  ██╔══██║██╔══╝  ██║     ██╔═══╝ ██╔══╝  ██╔══██╗    ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
  ██║  ██║███████╗███████╗██║     ███████╗██║  ██║    ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
  ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝    ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
  */

  convertDateToMysqlFormat(date) {
    return moment(date).format('YYYY-MM-DD HH:mm:ss')
  }


}
