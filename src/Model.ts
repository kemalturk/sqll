import * as _ from 'lodash'
import * as moment from 'moment'

// import mysql from 'mysql2/promise'
const mysql = require('mysql2/promise')

export default abstract class Model {

  table: string

  constructor() {
    this.table = this.getTableName()
  }

  // getTableName(): string {
  //   throw Error('You should override the getTableName method')
  // }
  abstract getTableName(): string

  // getDatabaseConfig(): object {
  //   throw Error('You should override the getDatabaseConfig method')
  // }
  abstract getDatabaseConfig(): object

  private async connect() {
    return await mysql.createConnection(this.getDatabaseConfig())
  }

  /*
  ╔═╗ ╦ ╦╔═╗╦═╗╦ ╦
  ║═╬╗║ ║║╣ ╠╦╝╚╦╝
  ╚═╝╚╚═╝╚═╝╩╚═ ╩ 
  */

  async query(sql: string, values: any[]) {

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
  ╔═╗╦╔╗╔╔╦╗  ╔═╗╔═╗ ╦ ╦╔═╗╦  
  ╠╣ ║║║║ ║║  ║╣ ║═╬╗║ ║╠═╣║  
  ╚  ╩╝╚╝═╩╝  ╚═╝╚═╝╚╚═╝╩ ╩╩═╝
  */

  async findEqual(where: object) {

    if(!_.isPlainObject(where)) {throw Error('parameter should be json object')}

    // Gelen json objesini sql where statement a çeviriyoruz
    let setStatement = ''

    const length = _.size(where)

    let i = 0

    const values: any[] = []

    _.forEach(where, (value, key) => {
      setStatement += '`' + key + '`' + '=' + ' ?'
      values.push(value)

      if (i < length - 1 ) {
        setStatement += ' AND '
      }

      i++
    })

    const sql = /*sql*/`Select * from ${this.table} where ${setStatement}`

    const r = await this.query(sql, values)

    if (!r) {return false}

    const [rows] = r

    if (!rows || rows.length !== 1) {return false}

    return rows[0]

  }

  /*
  ╔═╗╦╔╗╔╔╦╗  ╔═╗╦═╗  ╔═╗╦═╗╔═╗╔═╗╔╦╗╔═╗
  ╠╣ ║║║║ ║║  ║ ║╠╦╝  ║  ╠╦╝║╣ ╠═╣ ║ ║╣ 
  ╚  ╩╝╚╝═╩╝  ╚═╝╩╚═  ╚═╝╩╚═╚═╝╩ ╩ ╩ ╚═╝
  */

  async findOrCreate(data: object) {

    if (!_.isPlainObject(data)) {throw Error('parameter should be json object')}

    const existData = await this.findEqual(data)

    if (existData) {
      return existData
    } 

    const length = _.size(data)

    let i = 0

    let setStatement = ''

    const values: any[] = []

    _.forEach(data, (value, key) => {
      setStatement += '`' + key + '`' + '=' + '?'
      values.push(value)

      if (i < length - 1 ) {
        setStatement += ', '
      }

      i++
    })

    const sql = /*sql*/`insert into ${this.table} set ${setStatement}`
    
    const r = await this.query(sql, values)

    if (!r) {return false}

    const [response] = r

    if (response.affectedRows !== 1) {return false}
    
    return await this.findEqual({id: response.insertId})

  }

  /*
  ╦╔╗╔╔═╗╔═╗╦═╗╔╦╗  ╔═╗╦═╗  ╦ ╦╔═╗╔╦╗╔═╗╔╦╗╔═╗
  ║║║║╚═╗║╣ ╠╦╝ ║   ║ ║╠╦╝  ║ ║╠═╝ ║║╠═╣ ║ ║╣ 
  ╩╝╚╝╚═╝╚═╝╩╚═ ╩   ╚═╝╩╚═  ╚═╝╩  ═╩╝╩ ╩ ╩ ╚═╝
  */

  async insertOrUpdate(data: object, where: object) {

    if (!_.isPlainObject(data)) {throw Error('data parameter should be json object')}
    if (!_.isPlainObject(where)) {throw Error('where parameter should be json object')}

    const length = _.size(data)

    let i = 0

    let setStatement = ''

    let keysForQuery = ''
    let valuesForQuery = ''

    const values: any[] = []

    _.forEach(data, (value, key) => {
      // setStatement += "`"+key+"`" + " = " + "?"
      setStatement += '`' + key + '`' + ' = ' + '\'' + value + '\''
      values.push(value)

      keysForQuery += '`' + key + '`'
      valuesForQuery += '\'' + value + '\''

      if (i < length - 1 ) {
        setStatement += ', '
        keysForQuery += ','
        valuesForQuery += ','
      }
        
      i++
    })

    const sql = /*sql*/`insert into ${this.table} (${keysForQuery}) values (${valuesForQuery}) on duplicate key update ${setStatement} `

    const r = await this.query(sql, values)

    if (!r) {return false}

    const [response] = r

    if (response.affectedRows < 1) {return false}

    return await this.findEqual(where)

  }

  /*
  ╦╔╗╔╔═╗╔═╗╦═╗╔╦╗  ╔═╗╔╗╔╔═╗
  ║║║║╚═╗║╣ ╠╦╝ ║   ║ ║║║║║╣ 
  ╩╝╚╝╚═╝╚═╝╩╚═ ╩   ╚═╝╝╚╝╚═╝
  */

  async insertOne(data: object) {

    if (!_.isPlainObject(data)) {throw Error('data parameter should be json object')}

    const length = _.size(data)

    let i = 0

    let keysForQuery = ''
    let valuesForQuery = ''

    const values: any[] = []

    _.forEach(data, (value, key) => {

      values.push(value)

      keysForQuery += '`' + key + '`'
      valuesForQuery += '\'' + value + '\''

      if (i < length - 1 ) {
        keysForQuery += ','
        valuesForQuery += ','
      }
        
      i++
    })

    const sql = /*sql*/`insert into ${this.table} (${keysForQuery}) values (${valuesForQuery})`

    const r = await this.query(sql, values)

    if (!r) {return false}

    const [response] = r

    if (response.affectedRows < 1) {return false}
      
    return await this.findEqual(data)

  }

  /*
  ██╗  ██╗███████╗██╗     ██████╗ ███████╗██████╗     ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
  ██║  ██║██╔════╝██║     ██╔══██╗██╔════╝██╔══██╗    ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
  ███████║█████╗  ██║     ██████╔╝█████╗  ██████╔╝    █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
  ██╔══██║██╔══╝  ██║     ██╔═══╝ ██╔══╝  ██╔══██╗    ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
  ██║  ██║███████╗███████╗██║     ███████╗██║  ██║    ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
  ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝    ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
  */

  convertDateToMysqlFormat(date: any) {
    return moment(date).format('YYYY-MM-DD HH:mm:ss')
  }

}
